<template>
  <div class="fit">
    <!-- Search Bar (Optional future enhancement, placeholder for layout) -->
    <div class="q-pa-md">
      <q-input
        dense
        outlined
        v-model="search"
        placeholder="Search rooms..."
        :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
        :dark="$q.dark.isActive"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-separator />

    <!-- Room List -->
    <q-scroll-area class="room-list-scroll">
      <q-list separator>
        <q-item
          v-for="room in sortedRooms"
          :key="room.id"
          clickable
          v-ripple
          :active="room.id === activeRoomId"
          :active-class="
            $q.dark.isActive ? 'bg-grey-8 text-white rounded-borders' : 'bg-blue-1 text-primary'
          "
          @click="selectRoom(room.id)"
        >
          <q-item-section avatar>
            <q-avatar color="primary" :text-color="$q.dark.isActive ? 'black' : 'white'">
              <img v-if="room.avatarUrl" :src="room.avatarUrl" />
              <span v-else>{{ getInitials(room.name) }}</span>
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label lines="1" class="text-weight-bold">{{ room.name }}</q-item-label>
            <q-item-label caption lines="1">
              {{ room.lastMessage || 'No messages yet' }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <q-item-label caption>{{ formatTime(room.timestamp) }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRoomStore } from 'src/stores/room-store'
import { date } from 'quasar'

const roomStore = useRoomStore()
const search = ref('')

const sortedRooms = computed(() => {
  let rooms = roomStore.sortedRooms
  if (search.value) {
    const term = search.value.toLowerCase()
    rooms = rooms.filter((r) => r.name.toLowerCase().includes(term))
  }
  return rooms
})

const router = useRouter()
const route = useRoute()

const activeRoomId = computed(() => roomStore.activeRoomId)

const selectRoom = (roomId) => {
  roomStore.selectRoom(roomId)
  if (route.path !== '/') {
    router.push('/')
  }
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const formatTime = (ts) => {
  if (!ts) return ''
  const now = Date.now()
  const diff = now - ts
  // If less than 24h, show time
  if (diff < 86400000 && new Date(ts).getDate() === new Date(now).getDate()) {
    return date.formatDate(ts, 'HH:mm')
  }
  // Otherwise date
  return date.formatDate(ts, 'D MMM')
}
</script>

<style scoped>
.room-list-scroll {
  height: calc(100vh - 120px); /* Adjust based on header/search height */
}
</style>
