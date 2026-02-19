import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { Dark } from 'quasar'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // Persist to localStorage with key 'wraith-dark-mode'
    // Default to true (Cyber theme)
    isDarkMode: useStorage('wraith-dark-mode', true),

    // Persist 'wraith-send-enter'
    // Default to true
    sendOnEnter: useStorage('wraith-send-enter', true),
  }),

  actions: {
    init() {
      // Apply the persisted dark mode setting on startup
      Dark.set(this.isDarkMode)
    },

    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode
      Dark.set(this.isDarkMode)
    },

    setDarkMode(value) {
      this.isDarkMode = value
      Dark.set(value)
    },
  },
})
