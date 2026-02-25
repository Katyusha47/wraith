import { defineStore } from 'pinia'
import { matrixService } from '../services/matrix'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: null,
    deviceId: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }),

  actions: {
    /**
     * Initializes the auth state from existing session.
     */
    async init() {
      const resumed = await matrixService.init()
      if (resumed) {
        this.user = sessionStorage.getItem('matrix_user_id')
        this.accessToken = sessionStorage.getItem('matrix_access_token')
        this.deviceId = sessionStorage.getItem('matrix_device_id')
        this.isAuthenticated = true
      }
    },

    /**
     * Logs the user in.
     * @param {string} baseUrl
     * @param {string} username
     * @param {string} password
     */
    async login(baseUrl, username, password) {
      this.isLoading = true
      this.error = null
      try {
        const response = await matrixService.login(baseUrl, username, password)

        this.user = response.user_id
        this.accessToken = response.access_token
        this.deviceId = response.device_id
        this.isAuthenticated = true

        // Start the Sync Loop
        await matrixService.start()
      } catch (err) {
        // Clean up Matrix SDK error messages
        let niceError = 'Failed to login'

        if (err.httpStatus === 403 || (err.message && err.message.includes('403'))) {
          niceError = 'Invalid username or password.'
        } else if (err.message) {
          niceError = err.message
        }

        this.error = niceError
        this.isAuthenticated = false
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Logs the user out.
     */
    logout() {
      matrixService.stop()
      this.user = null
      this.accessToken = null
      this.deviceId = null
      this.isAuthenticated = false
    },
  },
})
