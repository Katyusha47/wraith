<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card class="login-card q-pa-lg shadow-2">
          <q-card-section>
            <div class="text-h5 text-center q-mb-md text-primary">Wraith</div>
            <div class="text-subtitle2 text-center text-grey-7">Sign in to your account</div>
          </q-card-section>

          <q-card-section>
            <q-form @submit="onSubmit" class="q-gutter-md">
              <q-input
                filled
                v-model="baseUrl"
                label="Homeserver URL"
                hint="e.g. https://matrix.org"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || 'Please type your homeserver URL']"
                dense
              >
                <template v-slot:prepend>
                  <q-icon name="dns" />
                </template>
              </q-input>

              <q-input
                filled
                v-model="username"
                label="Username / Matrix ID"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || 'Please type your username']"
                dense
              >
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-input>

              <q-input
                filled
                type="password"
                v-model="password"
                label="Password"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || 'Please type your password']"
                dense
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>

              <div v-if="authStore.error" class="text-negative text-center q-mt-sm">
                {{ authStore.error }}
              </div>

              <div>
                <q-btn
                  label="Login"
                  type="submit"
                  color="primary"
                  class="full-width"
                  :loading="authStore.isLoading"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from 'src/stores/auth-store'
import { useRouter } from 'vue-router'

// State
const baseUrl = ref('https://matrix.org')
const username = ref('')
const password = ref('')

// Stores & Router
const authStore = useAuthStore()
const router = useRouter()

/**
 * Handle Login Submission
 */
const onSubmit = async () => {
  await authStore.login(baseUrl.value, username.value, password.value)

  if (authStore.isAuthenticated) {
    router.push('/') // Redirect to home/chat view on success
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
}
</style>
