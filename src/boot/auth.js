import { boot } from 'quasar/wrappers'
import { useAuthStore } from 'stores/auth-store'
import { useRoomStore } from 'stores/room-store'

export default boot(async ({ router, store }) => {
  const authStore = useAuthStore(store)

  // Initialize auth state
  await authStore.init()

  // Initialize room store (listeners) if authenticated
  if (authStore.isAuthenticated) {
    const roomStore = useRoomStore(store)
    roomStore.init()
  }

  router.beforeEach((to, from, next) => {
    if (to.path !== '/login' && !authStore.isAuthenticated) {
      next('/login')
    } else if (to.path === '/login' && authStore.isAuthenticated) {
      next('/')
    } else {
      next()
    }
  })
})
