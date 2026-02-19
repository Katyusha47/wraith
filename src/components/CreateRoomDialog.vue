<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Create New Room</div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="name" label="Room Name" autofocus dense outlined class="q-mb-md" />
        <q-input
          v-model="topic"
          label="Topic (Optional)"
          dense
          outlined
          type="textarea"
          class="q-mb-md"
        />
        <q-toggle v-model="isEncrypted" label="Enable End-to-End Encryption" color="green" />
        <div class="text-caption text-grey q-mt-xs">Encrypted rooms are private by default.</div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" @click="onDialogCancel" />
        <q-btn flat label="Create" color="primary" @click="createRoom" :loading="creating" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { ref } from 'vue'
import { matrixService } from 'src/services/matrix'

defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const $q = useQuasar()

const name = ref('')
const topic = ref('')
const isEncrypted = ref(true)
const creating = ref(false)

async function createRoom() {
  if (!name.value.trim()) return

  creating.value = true
  try {
    const roomId = await matrixService.createRoom(name.value, topic.value, isEncrypted.value)
    onDialogOK(roomId)
  } catch (err) {
    console.error('Failed to create room', err)
    $q.notify({
      type: 'negative',
      message: 'Failed to create room: ' + (err.message || 'Unknown error'),
    })
  } finally {
    creating.value = false
  }
}
</script>
