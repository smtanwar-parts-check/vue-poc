<script setup lang="ts">
import { ref, watch } from 'vue'
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'
import { useIsMobile } from '@/composables/useIsMobile'
import { useNotifications } from '@/shared/useNotifications'

const isMobile = useIsMobile()
const drawerOpen = ref(!isMobile.value)
const notifications = useNotifications()

// Reset to a sensible default whenever we cross the mobile/desktop boundary —
// same rationale as the Angular build's Shell effect.
watch(isMobile, (mobile) => {
  drawerOpen.value = !mobile
})

function toggleDrawer(): void {
  drawerOpen.value = !drawerOpen.value
}
</script>

<template>
  <Header @toggle-nav="toggleDrawer" />

  <v-navigation-drawer v-model="drawerOpen" :temporary="isMobile" :permanent="!isMobile" width="240">
    <Sidebar />
  </v-navigation-drawer>

  <v-main>
    <div class="shell__content">
      <RouterView />
    </div>
  </v-main>

  <v-snackbar v-model="notifications.open.value" :color="notifications.color.value" :timeout="notifications.timeout.value">
    {{ notifications.message.value }}
    <template #actions>
      <v-btn variant="text" @click="notifications.open.value = false">Dismiss</v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>
.shell__content {
  padding: clamp(12px, 3vw, 24px);
  box-sizing: border-box;
  min-height: 100%;
}
</style>
