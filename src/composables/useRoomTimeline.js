import { ref, shallowRef, watch, onUnmounted, onMounted } from 'vue'
import { matrixService } from 'src/services/matrix'

export function useRoomTimeline(roomIdRef) {
  const events = shallowRef([])
  const loading = ref(false)
  const roomName = ref('')

  // Listener reference for cleanup
  let timelineListener = null

  const loadEvents = (roomId) => {
    if (!roomId || !matrixService.client) return
    const room = matrixService.getRoom(roomId)
    if (room) {
      // Get chronological events
      const liveEvents = room.getLiveTimeline().getEvents()
      events.value = [...liveEvents]
      roomName.value = room.name
    } else {
      events.value = []
      roomName.value = 'Room not found'
    }
  }

  const handleTimelineEvent = (event, room, toStartOfTimeline) => {
    if (!room || room.roomId !== roomIdRef.value) return
    if (toStartOfTimeline) return

    // efficient update: replace array to trigger shallowRef
    // In a real optimized app, we'd append, but shallowRef needs value change or manual trigger
    // Cloning is acceptable for < 1000 events usually.
    // For large lists, we might push and triggerRef.
    const newEvents = [...events.value, event]
    events.value = newEvents
  }

  // Setup/Teardown listeners
  const setupListener = () => {
    if (matrixService.client && !timelineListener) {
      timelineListener = (evt, room, toStart) => handleTimelineEvent(evt, room, toStart)
      matrixService.client.on('Room.timeline', timelineListener)
    }
  }

  const removeListener = () => {
    if (matrixService.client && timelineListener) {
      matrixService.client.removeListener('Room.timeline', timelineListener)
      timelineListener = null
    }
  }

  // Watch for Room ID changes
  watch(
    roomIdRef,
    (newId) => {
      loadEvents(newId)
    },
    { immediate: true },
  )

  onMounted(() => {
    setupListener()
    if (roomIdRef.value) {
      loadEvents(roomIdRef.value)
    }
  })

  onUnmounted(() => {
    removeListener()
  })

  return {
    events,
    loading,
    roomName,
  }
}
