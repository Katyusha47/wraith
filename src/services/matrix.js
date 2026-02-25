import { createClient } from 'matrix-js-sdk'
import { initAsync } from '@matrix-org/matrix-sdk-crypto-wasm'
import { logger } from 'matrix-js-sdk/lib/logger'
import { useCryptoStore } from 'src/stores/crypto-store'

// Silence SDK logs (Security & Cleanliness)
logger.setLevel('WARN')

/**
 * Service Layer for Matrix SDK authentication and syncing.
 * This class follows the Singleton pattern and must be used
 * via `matrixService` export.
 */
class MatrixService {
  constructor() {
    /** @type {import('matrix-js-sdk').MatrixClient | null} */
    this.client = null
    /** @type {Function | null} */
    this.onRoomEvent = null
  }

  /**
   * Initializes the Matrix Client if session data exists.
   * Checks sessionStorage for existing credentials.
   * @returns {Promise<boolean>} True if client resumed, false otherwise.
   */
  async init() {
    const accessToken = sessionStorage.getItem('matrix_access_token')
    const userId = sessionStorage.getItem('matrix_user_id')
    const baseUrl = sessionStorage.getItem('matrix_base_url')
    const deviceId = sessionStorage.getItem('matrix_device_id')

    if (accessToken && userId && baseUrl && deviceId) {
      this.client = createClient({
        baseUrl,
        accessToken,
        userId,
        deviceId,
      })

      // Start client if session resumed
      await this.start()
      return true
    }
    return false
  }

  /**
   * Login with username and password.
   * @param {string} baseUrl - The Homeserver URL (e.g. "https://matrix.org").
   * @param {string} username - User's matrix ID (localpart) or full ID.
   * @param {string} password - User's password.
   * @returns {Promise<Object>} The login response (access_token, home_server, user_id, device_id).
   */
  async login(baseUrl, username, password) {
    // Temporary client for login
    const tempClient = createClient({ baseUrl })

    const response = await tempClient.login('m.login.password', {
      user: username,
      password: password,
    })

    // Store credentials
    // Assuming authStore.setCredentials is meant to replace sessionStorage.setItem calls
    // If authStore is not defined, this will cause an error.
    // For now, keeping sessionStorage as per original file structure.
    sessionStorage.setItem('matrix_access_token', response.access_token)
    sessionStorage.setItem('matrix_user_id', response.user_id)
    sessionStorage.setItem(
      'matrix_base_url',
      response.home_server ? `https://${response.home_server}` : baseUrl,
    ) // simplified assumption for now
    sessionStorage.setItem('matrix_device_id', response.device_id)

    // Initialize MAIN client with new credentials
    this.client = createClient({
      baseUrl: baseUrl,
      accessToken: response.access_token,
      userId: response.user_id,
      deviceId: response.device_id,
      timelineSupport: true,
    })

    await this.start()
    return response
  }

  /**
   * Initialize Crypto (Rust)
   */
  async initCrypto() {
    try {
      // Pre-initialize WASM with correct public path to avoid MIME type errors
      await initAsync('/matrix_sdk_crypto_wasm_bg.wasm')

      if (this.client) {
        await this.client.initRustCrypto()
      }
    } catch (e) {
      if (e.message && e.message.includes('account in the store')) {
        console.warn('Crypto Store mismatch. Resetting crypto store.', e)

        try {
          const dbs = await window.indexedDB.databases()
          const targetParams = ['crypto', 'matrix']
          const toDelete = dbs
            .filter((d) => targetParams.some((p) => d.name && d.name.includes(p)))
            .map((d) => d.name)

          console.log('Deleting conflicting DBs:', toDelete)

          for (const dbName of toDelete) {
            await new Promise((resolve) => {
              const req = window.indexedDB.deleteDatabase(dbName)
              req.onsuccess = () => {
                console.log('Deleted:', dbName)
                resolve()
              }
              req.onerror = (err) => {
                console.error('Failed to delete:', dbName, err)
                resolve() // Continue anyway
              }
              req.onblocked = () => {
                console.warn('Delete blocked for:', dbName)
                resolve() // Continue anyway
              }
            })
          }
        } catch (err) {
          console.error('Failed to list/delete DBs', err)
          // Fallback default name
          try {
            window.indexedDB.deleteDatabase('matrix-js-sdk:crypto')
          } catch (e2) {
            console.error(e2)
          }
        }

        console.log('Reloading page to apply clean slate...')
        window.location.reload()
      } else {
        console.error('Failed to initialize Rust Crypto', e)
      }
    }
  }

  /**
   * Start the Matrix Client and setup listeners.
   */
  async start() {
    if (!this.client) {
      throw new Error('Matrix Client not initialized. Call login() or init() first.')
    }

    // Initialize Crypto
    await this.initCrypto()

    // Start Client
    await this.client.startClient({ initialSyncLimit: 10 })

    // Setup Event Listeners
    this.setupListeners()
  }

  /**
   * Sets up event listeners for Room and Timeline events.
   * Dispatches to Store via callback (Dependency Injection style or direct import if simple).
   */
  setupListeners() {
    if (!this.client) return

    this.client.on('Room.timeline', (event, room, toStartOfTimeline) => {
      // console.log('MatrixService: Room.timeline', room.roomId)
      if (toStartOfTimeline) return // Ignore pagination for now
      if (this.onRoomEvent) {
        this.onRoomEvent(event, room)
      }
    })

    this.client.on('Room', (room) => {
      // console.log('MatrixService: New Room detected', room.roomId, room.name)
      if (this.onRoomEvent) {
        this.onRoomEvent(null, room)
      }
    })

    // Phase 4: Device Verification
    // Listen for incoming verification requests
    const handleVerificationRequest = (request) => {
      console.log('MatrixService: Incoming verification request', request)
      try {
        const cryptoStore = useCryptoStore()
        cryptoStore.handleRequest(request)
      } catch (e) {
        console.error('MatrixService: Failed to handle verification request', e)
      }
    }

    // Try attaching to Client (might proxy) and Crypto (source)
    this.client.on('crypto.verification.request', handleVerificationRequest)

    // Also try attaching directly to crypto backend if available
    try {
      const crypto = this.client.getCrypto ? this.client.getCrypto() : this.client.crypto
      if (crypto && crypto.on) {
        // For Rust Crypto, the event name is 'verificationRequestReceived'
        // (mapped from CryptoEvent.VerificationRequestReceived = "crypto.verificationRequestReceived")
        crypto.on('crypto.verificationRequestReceived', handleVerificationRequest)
      }
    } catch (e) {
      console.warn('MatrixService: Could not attach to crypto backend directly', e)
    }
  }

  /**
   * Registers a callback to handle incoming room events.
   * Used by the RoomStore to subscribe to updates.
   * @param {Function} callback - Function(event, room)
   */
  setRoomEventCallback(callback) {
    this.onRoomEvent = callback
  }

  /**
   * Returns a specific room by ID.
   * @param {string} roomId
   * @returns {import('matrix-js-sdk').Room | null}
   */
  getRoom(roomId) {
    if (!this.client) return null
    return this.client.getRoom(roomId)
  }

  /**
   * Returns all joined rooms.
   * @returns {import('matrix-js-sdk').Room[]}
   */
  getRooms() {
    if (!this.client) return []
    return this.client.getRooms()
  }

  /**
   * Creates a new room.
   * @param {string} name
   * @param {string} topic
   * @param {boolean} isEncrypted
   * @returns {Promise<string>} roomId
   */
  async createRoom(name, topic, isEncrypted = true) {
    if (!this.client) throw new Error('Client not initialized')

    const options = {
      name,
      topic,
      visibility: 'private', // Constraint: Default private
      preset: 'private_chat', // Constraint: Default private_chat
      initial_state: [],
    }

    if (isEncrypted) {
      options.initial_state.push({
        type: 'm.room.encryption',
        state_key: '',
        content: {
          algorithm: 'm.megolm.v1.aes-sha2',
        },
      })
    }

    const result = await this.client.createRoom(options)
    return result.room_id
  }

  /**
   * Resolves a Matrix content URI (mxc://) to an HTTP URL.
   * @param {string} mxcUrl
   * @param {number} width (optional)
   * @param {number} height (optional)
   * @param {string} resizeMethod (optional) 'crop' or 'scale'
   * @returns {string | null}
   */
  resolveAvatarUrl(mxcUrl, width = 64, height = 64, resizeMethod = 'crop') {
    if (!this.client || !mxcUrl) return null
    // Fallback to non-thumbnail if width/height not provided, though we provide defaults anyway
    return this.client.mxcUrlToHttp(mxcUrl, width, height, resizeMethod)
  }

  /**
   * Searches the public room directory.
   * @param {string} searchTerm
   * @param {number} limit
   * @returns {Promise<{rooms: Array, total: number}>}
   */
  async searchPublicRooms(searchTerm, limit = 20) {
    if (!this.client) throw new Error('Client not initialized')

    const response = await this.client.publicRooms({
      limit: limit,
      filter: {
        generic_search_term: searchTerm || undefined,
      },
    })

    const rooms = (response.chunk || []).map((room) => ({
      roomId: room.room_id,
      name: room.name,
      topic: room.topic,
      avatarUrl: this.resolveAvatarUrl(room.avatar_url, 128, 128), // Pre-resolve the HTTP url
      memberCount: room.num_joined_members || 0,
      canonicalAlias: room.canonical_alias,
      worldReadable: room.world_readable,
      guestCanJoin: room.guest_can_join,
    }))

    return {
      rooms,
      total: response.total_room_count_estimate || rooms.length,
    }
  }

  /**
   * Joins a room by ID or Alias.
   * @param {string} roomIdOrAlias
   * @returns {Promise<string>} The joined room ID
   */
  async joinRoom(roomIdOrAlias) {
    if (!this.client) throw new Error('Client not initialized')
    const room = await this.client.joinRoom(roomIdOrAlias)
    // The SDK's joinRoom often returns { room_id: string } or the Room object depending on how it was joined/found.
    // We normalize to returning the room ID string for router pushing.
    return room.roomId || room.room_id || roomIdOrAlias
  }

  /**
   * Sends a text message to a room.
   * @param {string} roomId
   * @param {string} body
   * @returns {Promise<void>}
   */
  async sendMessage(roomId, body) {
    if (!this.client) return
    await this.client.sendEvent(roomId, 'm.room.message', {
      msgtype: 'm.text',
      body: body,
    })
  }

  /**
   * Stops the client and clears session.
   */
  stop() {
    if (this.client) {
      this.client.stopClient()
      this.client = null
    }
    sessionStorage.clear()
  }
}

export const matrixService = new MatrixService()
