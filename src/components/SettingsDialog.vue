<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card
      :class="['q-dialog-plugin', 'settings-card', $q.dark.isActive ? 'settings-card-dark' : '']"
    >
      <q-card-section>
        <div class="text-h6 text-primary">App Settings</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-list>
          <q-item tag="label" v-ripple>
            <q-item-section>
              <q-item-label>Dark Mode</q-item-label>
              <q-item-label caption>Enable Dark Mode</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle
                v-model="settings.isDarkMode"
                color="secondary"
                @update:model-value="settings.setDarkMode"
              />
            </q-item-section>
          </q-item>

          <q-item tag="label" v-ripple>
            <q-item-section>
              <q-item-label>Send on Enter</q-item-label>
              <q-item-label caption>Shift+Enter for new line</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle v-model="settings.sendOnEnter" color="primary" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="primary" label="Close" @click="onDialogOK" flat />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent } from 'quasar'
import { useSettingsStore } from 'src/stores/settings-store'

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
const settings = useSettingsStore()

defineEmits([...useDialogPluginComponent.emits])
</script>

<style lang="scss" scoped>
.settings-card {
  min-width: 350px;
}

.settings-card-dark {
  background: rgba(10, 10, 10, 0.95);
  border: 1px solid $primary;
  box-shadow: 0 0 15px rgba($primary, 0.2);
}
</style>
