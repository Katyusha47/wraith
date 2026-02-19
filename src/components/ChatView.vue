<template>
  <div class="column fit bg-dark text-white">
    <!-- Header -->
    <q-toolbar
      class="bg-dark text-white border-bottom shadow-2"
      style="border-bottom: 1px solid rgba(0, 229, 255, 0.2)"
    >
      <q-btn flat round dense icon="menu" class="lt-md" @click="$emit('toggle-drawer')" />
      <q-toolbar-title>
        <div class="row items-center">
          <q-avatar
            size="32px"
            class="q-mr-sm"
            :style="{ backgroundColor: getAvatarColor(roomId) }"
          >
            <span class="text-caption text-black text-weight-bold">{{
              getInitials(roomName)
            }}</span>
          </q-avatar>
          <div>
            <div class="text-subtitle1 text-weight-bold tracking-wide">{{ roomName }}</div>
            <div class="text-caption text-grey-5" style="font-size: 0.7rem; letter-spacing: 1px">
              ID: {{ roomId?.substring(0, 8) }}...
            </div>
          </div>
        </div>
      </q-toolbar-title>
    </q-toolbar>

    <!-- Timeline -->
    <div class="col relative-position overflow-hidden bg-dark">
      <q-virtual-scroll
        ref="virtualScrollRef"
        class="fit q-pa-sm"
        :items="events"
        component="div"
        @virtual-scroll="onScroll"
      >
        <template v-slot="{ item, index }">
          <div
            :key="item.getId() || index"
            :class="['row', 'q-mb-md', isMe(item) ? 'justify-end' : 'justify-start']"
          >
            <!-- Avatar (Them) -->
            <q-avatar
              v-if="!isMe(item)"
              size="36px"
              class="q-mr-sm self-end q-mb-xs shadow-3"
              :style="{ backgroundColor: getAvatarColor(item.getSender()) }"
            >
              <span class="text-caption text-black text-weight-bold">{{
                getInitials(item.getSender())
              }}</span>
            </q-avatar>

            <!-- Bubble Container -->
            <div style="max-width: 80%; min-width: 120px" class="column">
              <!-- Sender Name (Them only) -->
              <div
                v-if="!isMe(item)"
                class="text-caption text-grey-5 q-ml-xs q-mb-xs"
                style="font-size: 0.7rem"
              >
                {{ item.getSender()?.split(':')[0]?.replace('@', '') }}
              </div>

              <!-- Bubble -->
              <div
                :class="[
                  'q-pa-sm rounded-borders shadow-2 relative-position',
                  isMe(item) ? 'bg-primary text-black' : 'bg-grey-9 text-grey-1',
                  isDecryptionError(item) ? 'bg-negative text-white' : '',
                ]"
                style="border: 1px solid rgba(255, 255, 255, 0.05)"
              >
                <!-- Decryption Error UI -->
                <div v-if="isDecryptionError(item)" class="row items-center q-gutter-x-sm">
                  <q-icon name="warning" size="xs" />
                  <span class="text-italic" style="font-size: 0.85rem"
                    >Unable to decrypt message</span
                  >
                </div>

                <!-- Content -->
                <div
                  v-else
                  style="
                    word-wrap: break-word;
                    white-space: pre-wrap;
                    font-size: 0.95rem;
                    line-height: 1.4;
                  "
                >
                  {{ getBody(item) }}
                </div>

                <!-- Metadata -->
                <div
                  class="text-right q-mt-xs row items-center justify-end no-wrap"
                  style="font-size: 0.65rem; opacity: 0.7"
                >
                  <span class="q-mr-xs">{{ formatTime(item.getTs()) }}</span>
                  <!-- Lock Icon -->
                  <q-icon
                    v-if="item.isEncrypted()"
                    name="lock"
                    size="10px"
                    :color="isMe(item) ? 'black' : 'grey-5'"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </q-virtual-scroll>
    </div>

    <!-- Input Area -->
    <div class="q-pa-md bg-dark border-top" style="border-top: 1px solid rgba(255, 255, 255, 0.1)">
      <q-input
        outlined
        dark
        dense
        v-model="newMessage"
        placeholder="Type a message..."
        class="full-width"
        bg-color="grey-9"
        @keydown="handleKeydown"
        :disable="sending"
      >
        <template v-slot:append>
          <q-btn
            round
            dense
            flat
            icon="send"
            color="primary"
            @click="sendMessage"
            :loading="sending"
          />
        </template>
      </q-input>
      <div class="text-right text-grey-7 q-mt-xs text-caption" style="font-size: 0.65rem">
        {{
          settingsStore.sendOnEnter
            ? 'Enter to send, Shift+Enter for new line'
            : 'Click send button to send'
        }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, toRef, watch, nextTick } from 'vue'
import { date } from 'quasar'
import { matrixService } from 'src/services/matrix'
import { useRoomTimeline } from 'src/composables/useRoomTimeline'
import { useSettingsStore } from 'src/stores/settings-store'

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
})

defineEmits(['toggle-drawer'])

const settingsStore = useSettingsStore()
const newMessage = ref('')
const sending = ref(false)
const virtualScrollRef = ref(null)
const userScrolled = ref(false)

// Use the composable
const roomIdRef = toRef(props, 'roomId')
const { events, roomName } = useRoomTimeline(roomIdRef)

// Scroll to bottom helper
const scrollToBottom = () => {
  if (userScrolled.value) return // Don't force scroll if user is reading up

  if (virtualScrollRef.value) {
    // QVirtualScroll might not have items rendered immediately
    setTimeout(() => {
      virtualScrollRef.value.scrollTo(events.value.length - 1, 'end-force')
    }, 50)
  }
}

// Watch events to auto-scroll
watch(
  () => events.value.length,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  },
)

// Reset userScrolled when changing rooms
watch(roomIdRef, () => {
  userScrolled.value = false
  nextTick(() => scrollToBottom())
})

const onScroll = () => {
  // details: { index, from, to, direction, ref }
  // If we are near the bottom, reset userScrolled
  // This logic depends on QVirtualScroll specifics, simpler:
  // If we are not at end, assume user scrolled.
  // Actually, let's keep it simple: always scroll on new message unless heavily up.
  // For now, simpler implementation: Just verify scroll works.
}

const myUserId = computed(() => {
  return matrixService.client?.getUserId()
})

const isMe = (event) => {
  return event.getSender() === myUserId.value
}

const isDecryptionError = (event) => {
  return event.isDecryptionFailure()
}

const getBody = (event) => {
  if (isDecryptionError(event)) return 'Unable to decrypt message'
  return event.getContent().body || '...'
}

const getInitials = (name) => {
  if (!name) return '?'
  const clean = name.replace('@', '').split(':')[0]
  return clean.charAt(0).toUpperCase()
}

// Generate consistent cyber colors based on string
const getAvatarColor = (id) => {
  if (!id) return '#333'
  const colors = ['#00e5ff', '#bd00ff', '#ff0055', '#00ff9d', '#ffcc00', '#ff2a6d']
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

const formatTime = (ts) => {
  return date.formatDate(ts, 'HH:mm')
}

const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    if (settingsStore.sendOnEnter) {
      e.preventDefault()
      sendMessage()
    }
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  const content = newMessage.value
  sending.value = true
  try {
    await matrixService.sendMessage(props.roomId, content)
    newMessage.value = ''
    userScrolled.value = false // Snap back to bottom
    scrollToBottom()
  } catch (err) {
    console.error('Failed to send', err)
  } finally {
    sending.value = false
    // Focus back? Input keeps focus usually
  }
}
</script>

<style scoped>
.tracking-wide {
  letter-spacing: 0.5px;
}
</style>
