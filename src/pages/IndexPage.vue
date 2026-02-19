<template>
  <q-page :class="['flex relative-position', $q.dark.isActive ? 'bg-dark' : 'bg-grey-2']">
    <ChatView
      v-if="activeRoomId"
      :roomId="activeRoomId"
      class="fit absolute-full"
      @toggle-drawer="toggleDrawer"
    />

    <div v-else class="column flex-center fit text-center p-md">
      <q-icon name="forum" size="100px" color="grey-4" />
      <div :class="['text-h5 q-mt-md', $q.dark.isActive ? 'text-grey-4' : 'text-grey-7']">
        Welcome to Wraith Matrix
      </div>
      <div :class="['text-body1 q-mt-sm', $q.dark.isActive ? 'text-grey-6' : 'text-grey-6']">
        Select a room from the left to start messaging.
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoomStore } from 'stores/room-store'
import ChatView from 'components/ChatView.vue'

defineOptions({
  name: 'IndexPage',
})

const roomStore = useRoomStore()
const activeRoomId = computed(() => roomStore.activeRoomId)

// Optional: Inject toggle if layout provides it (advanced)
// For now, we just log or ignore
const toggleDrawer = () => {
  // console.log('Toggle drawer requested')
}
</script>
