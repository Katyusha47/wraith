<template>
  <router-view />
</template>

<script setup>
import { inject } from '@vercel/analytics'
import { onMounted } from 'vue'

defineOptions({
  name: 'App',
})

onMounted(() => {
  inject() // Start Vercel Analytics
})
</script>
