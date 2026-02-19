import { defineStore } from 'pinia'

export const useCryptoStore = defineStore('crypto', {
  state: () => ({
    request: null, // VerificationRequest
    verifier: null, // Verifier
    sasEvent: null, // ShowSasCallbacks
    verificationState: 'IDLE', // IDLE, REQUESTED, STARTED, SHOW_SAS, VERIFIED, CANCELLED
    error: null,
  }),

  getters: {
    isVerifying: (state) => state.verificationState !== 'IDLE',

    otherDeviceId: (state) => {
      if (state.request) {
        return state.request.otherDeviceId || 'Unknown Device'
      }
      return ''
    },

    sasEmojis: (state) => {
      if (state.sasEvent && state.sasEvent.sas && state.sasEvent.sas.emoji) {
        return state.sasEvent.sas.emoji // Returns [emoji, name][]
      }
      return []
    },

    sasDecimal: (state) => {
      if (state.sasEvent && state.sasEvent.sas && state.sasEvent.sas.decimal) {
        return state.sasEvent.sas.decimal
      }
      return null
    },
  },

  actions: {
    /**
     * Handle incoming verification request from MatrixService
     * @param {import('matrix-js-sdk').VerificationRequest} request
     */
    async handleRequest(request) {
      if (this.request) {
        // If we are already verifying, ignore or log?
        // For now, ignore collision
        return
      }

      this.reset()
      this.request = request
      this.verificationState = 'REQUESTED'

      // Listen for phase changes
      const onChange = () => {
        if (!this.request) return // Stopped

        // If phase becomes Started and we have a verifier, hook it up
        if (this.request.phase === 4 /* Started */ && this.request.verifier) {
          this.setupVerifier(this.request.verifier)
          this.request.off('change', onChange) // Stop listening to request, move to verifier
        }

        // Handle cancellation
        if (this.request.phase === 5) {
          this.verificationState = 'CANCELLED'
          this.error = 'Verification cancelled by other party.'
          this.request.off('change', onChange)
        }
      }

      request.on('change', onChange)
    },

    /**
     * Accept the incoming verification request
     */
    async acceptRequest() {
      if (!this.request) return

      try {
        await this.request.accept()
        this.verificationState = 'STARTED' // Waiting for 'show_sas'
      } catch (e) {
        console.error('Failed to accept verification', e)
        this.error = e.message
        this.verificationState = 'CANCELLED'
      }
    },

    /**
     * Setup listeners on the Verifier object
     * @param {import('matrix-js-sdk').Verifier} verifier
     */
    setupVerifier(verifier) {
      this.verifier = verifier

      verifier.on('show_sas', (event) => {
        console.debug('CryptoStore: Show SAS', event) // Debug level
        this.sasEvent = event
        this.verificationState = 'SHOW_SAS'
      })

      verifier.on('cancel', (e) => {
        console.debug('CryptoStore: Verifier Cancel', e)
        this.verificationState = 'CANCELLED'
        this.error = e.message || 'Verification cancelled'
      })

      // If it just finishes without SAS (e.g. QR code - not implemented yet but good to know)
      // verifier.verify() promise resolves when done.

      // Use the promise returned by verify() to track completion
      verifier
        .verify()
        .then(() => {
          this.verificationState = 'VERIFIED'
          setTimeout(() => this.reset(), 3000)
        })
        .catch((err) => {
          console.error('Verification failed', err)
          if (this.verificationState !== 'CANCELLED') {
            this.error = err.message
            this.verificationState = 'CANCELLED'
          }
        })
    },

    /**
     * User confirms emojis match
     */
    async confirmMatch() {
      if (this.sasEvent) {
        try {
          await this.sasEvent.confirm()
          // State upgrade to VERIFIED will happen via verifier.verify() promise resolution
        } catch (e) {
          this.error = 'Failed to confirm match: ' + e.message
        }
      }
    },

    /**
     * User rejects/cancels
     */
    cancel() {
      if (this.request && this.request.cancel) {
        try {
          this.request.cancel({ reason: 'User declined' })
        } catch {
          /* ignore */
        }
      }
      if (this.sasEvent && this.sasEvent.cancel) {
        try {
          this.sasEvent.cancel()
        } catch {
          /* ignore */
        }
      }

      this.verificationState = 'CANCELLED'
      setTimeout(() => this.reset(), 2000)
    },

    reset() {
      if (this.request) {
        this.request.removeAllListeners('change')
      }
      this.request = null
      this.verifier = null
      this.sasEvent = null
      this.verificationState = 'IDLE'
      this.error = null
    },
  },
})
