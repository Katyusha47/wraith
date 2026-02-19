import { defineStore } from 'pinia'
import { matrixService } from '../services/matrix'

export const useRoomStore = defineStore('room', {
  state: () => ({
    rooms: {}, // Map<roomId, RoomSummary>
    activeRoomId: null,
    isLoading: false,
  }),

  getters: {
    roomList: (state) => Object.values(state.rooms),

    sortedRooms: (state) => {
      return Object.values(state.rooms).sort((a, b) => {
        // Sort by timestamp desc (newest first)
        return (b.timestamp || 0) - (a.timestamp || 0)
      })
    },

    activeRoom: (state) => {
      return state.activeRoomId ? state.rooms[state.activeRoomId] || null : null
    },
  },

  actions: {
    /**
     * Initializes the room store listeners.
     */
    init() {
      // Register callback with Matrix Service
      matrixService.setRoomEventCallback(this.handleRoomEvent)
    },

    /**
     * Populates the store with all currently joined rooms.
     * Call this after initial sync.
     */
    async fetchRooms() {
      this.isLoading = true
      const sdkRooms = matrixService.getRooms()
      sdkRooms.forEach((room) => {
        // Extract last event if possible
        const events = room.getLiveTimeline().getEvents()
        const lastEvent = events.length > 0 ? events[events.length - 1] : null
        this.updateRoomState(room, lastEvent)
      })
      this.isLoading = false
    },

    /**
     * Selects a room to view.
     * @param {string} roomId
     */
    selectRoom(roomId) {
      this.activeRoomId = roomId
    },

    /**
     * Handles incoming room events from Matrix Service.
     * @param {Object} event - The Matrix Event.
     * @param {Object} room - The Room object.
     */
    handleRoomEvent(event, room) {
      if (!room) return
      // console.log('RoomStore: Processing room update', room.roomId)
      this.updateRoomState(room, event)
    },

    /**
     * Updates the local state for a room.
     * @param {import('matrix-js-sdk').Room} room
     * @param {import('matrix-js-sdk').MatrixEvent} [event]
     */
    updateRoomState(room, event) {
      let lastEvent = event
      if (!lastEvent) {
        const events = room.getLiveTimeline().getEvents()
        if (events.length > 0) {
          lastEvent = events[events.length - 1]
        }
      }

      const lastMessageBody = lastEvent?.getContent().body || ''
      const lastMessageTs = lastEvent?.getTs() || Date.now()

      // Calculate name fallback
      // Note: room.name is usually calculated by the SDK based on state events
      const name = room.name || room.roomId

      this.rooms[room.roomId] = {
        id: room.roomId,
        name: name,
        avatarUrl: room.getAvatarUrl
          ? room.getAvatarUrl(matrixService.client?.baseUrl, 32, 32, 'crop')
          : null,
        lastMessage: lastMessageBody,
        timestamp: lastMessageTs,
        // memberCount: room.getJoinedMemberCount(), // Optional
      }
    },

    /**
     * Clears room state on logout.
     */
    clear() {
      this.rooms = {}
      this.activeRoomId = null
    },
  },
})
