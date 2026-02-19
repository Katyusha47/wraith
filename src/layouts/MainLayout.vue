<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Wraith Matrix </q-toolbar-title>

        <q-space />

        <div class="q-mr-md row items-center" v-if="authStore.user">
          <span class="q-mr-sm text-subtitle2">{{ authStore.user }}</span>
          <q-badge color="green" rounded v-if="authStore.isAuthenticated" />
        </div>

        <q-btn
          flat
          round
          dense
          icon="settings"
          @click="openSettingsDialog"
          v-if="authStore.isAuthenticated"
        />
        <q-btn flat round dense icon="logout" @click="logout" v-if="authStore.isAuthenticated" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <div class="row items-center q-pa-md border-bottom">
        <div class="text-h6">Rooms</div>
        <q-space />
        <q-btn flat round dense icon="add" color="primary" @click="openCreateRoomDialog" />
      </div>
      <RoomList />
    </q-drawer>

    <q-page-container :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-2'">
      <router-view />
    </q-page-container>

    <VerificationDialog />
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth-store'
import { useRoomStore } from 'stores/room-store'
import { useSettingsStore } from 'stores/settings-store'
import RoomList from 'components/RoomList.vue'
import CreateRoomDialog from 'components/CreateRoomDialog.vue'
import VerificationDialog from 'components/VerificationDialog.vue'
import SettingsDialog from 'components/SettingsDialog.vue'

defineOptions({
  name: 'MainLayout',
})

const leftDrawerOpen = ref(false)
const authStore = useAuthStore()
const roomStore = useRoomStore()
const settingsStore = useSettingsStore()
const router = useRouter()
const $q = useQuasar()

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

async function logout() {
  roomStore.clear()
  await authStore.logout()
  router.push('/login')
}

function openCreateRoomDialog() {
  $q.dialog({
    component: CreateRoomDialog,
  }).onOk((roomId) => {
    if (roomId) {
      roomStore.selectRoom(roomId)
    }
  })
}

function openSettingsDialog() {
  $q.dialog({
    component: SettingsDialog,
  })
}

onMounted(() => {
  // Initialize settings (Dark Mode)
  settingsStore.init()

  if (authStore.isAuthenticated) {
    roomStore.fetchRooms()
  }
})
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}
</style>
