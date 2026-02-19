<template>
  <q-dialog v-model="isOpen" persistent seamless position="bottom">
    <q-card class="q-ma-md" style="width: 350px; border-radius: 12px">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Verify Session</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="cancel" />
      </q-card-section>

      <!-- Content -->
      <q-card-section>
        <!-- State: REQUESTED -->
        <div v-if="state === 'REQUESTED'" class="text-center">
          <q-icon name="security" size="40px" color="warning" class="q-mb-sm" />
          <div class="text-body1 text-weight-bold">Incoming Request</div>
          <p class="text-caption q-mt-xs">
            Device <strong>{{ otherDeviceId }}</strong> wants to verify this session.
          </p>
          <div class="row justify-center q-gutter-sm q-mt-md">
            <q-btn label="Decline" color="negative" flat @click="cancel" />
            <q-btn label="Accept" color="positive" @click="accept" />
          </div>
        </div>

        <!-- State: SHOW_SAS -->
        <div v-if="state === 'SHOW_SAS'" class="text-center">
          <div class="text-body2 q-mb-md">Do the following emojis match the other device?</div>

          <div class="row q-gutter-sm justify-center q-mb-md">
            <div
              v-for="(emoji, index) in sasEmojis"
              :key="index"
              class="column items-center q-pa-xs bg-grey-2 rounded-borders"
              style="width: 60px"
            >
              <div class="text-h4">{{ emoji[0] }}</div>
              <!-- Emoji Char -->
              <div class="text-caption" style="font-size: 0.6rem">{{ emoji[1] }}</div>
              <!-- Emoji Name -->
            </div>
          </div>

          <div class="row justify-center q-gutter-sm">
            <q-btn label="No Match" color="negative" flat @click="mismatch" />
            <q-btn label="They Match" color="positive" @click="confirm" />
          </div>
        </div>

        <!-- State: VERIFIED -->
        <div v-if="state === 'VERIFIED'" class="text-center text-positive">
          <q-icon name="verified_user" size="50px" class="q-mb-sm" />
          <div class="text-h6">Verified!</div>
          <div class="text-caption">This session is now trusted.</div>
        </div>

        <!-- State: CANCELLED / ERROR -->
        <div v-if="state === 'CANCELLED'" class="text-center text-negative">
          <q-icon name="error_outline" size="40px" class="q-mb-sm" />
          <div class="text-body1">Verification Failed</div>
          <div class="text-caption">{{ error || 'Session verification was cancelled.' }}</div>
          <q-btn label="Close" flat color="grey" class="q-mt-md" @click="close" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useCryptoStore } from 'src/stores/crypto-store'

const store = useCryptoStore()

// Dialog visibility based on store state
const isOpen = computed({
  get: () => store.isVerifying,
  set: (val) => {
    if (!val) store.cancel() // Closing dialog cancels process
  },
})

// Bindings to store
const state = computed(() => store.verificationState)
const otherDeviceId = computed(() => store.otherDeviceId)
const sasEmojis = computed(() => store.sasEmojis)
const error = computed(() => store.error)

// Actions
function accept() {
  store.acceptRequest()
}

function confirm() {
  store.confirmMatch()
}

function mismatch() {
  store.cancel()
}

function cancel() {
  store.cancel()
}

function close() {
  store.reset()
}
</script>
