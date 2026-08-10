<script setup lang="ts">
interface NavItem {
  label: string
  icon: string
  to?: string
  disabled?: boolean
}

const navItems: NavItem[] = [
  { label: 'API Explorer', icon: 'mdi-earth', to: '/api-explorer' },
  { label: 'Parts Manager', icon: 'mdi-package-variant-closed', to: '/stress-test' },
  { label: 'Suppliers', icon: 'mdi-truck-outline', disabled: true },
  { label: 'Reports', icon: 'mdi-chart-line', disabled: true },
]
</script>

<template>
  <v-list nav class="sidebar-nav">
    <template v-for="item in navItems" :key="item.label">
      <v-tooltip v-if="item.disabled" text="Coming soon" location="right">
        <template #activator="{ props }">
          <v-list-item v-bind="props" :prepend-icon="item.icon" :title="item.label" disabled />
        </template>
      </v-tooltip>
      <v-list-item v-else :to="item.to" :prepend-icon="item.icon" :title="item.label" class="sidebar-nav__item" />
    </template>
  </v-list>
</template>

<style scoped>
.sidebar-nav {
  padding-top: 12px;
}

.sidebar-nav__item {
  border-left: 3px solid transparent;
}

.sidebar-nav__item.v-list-item--active {
  background: rgba(var(--v-theme-primary), 0.12);
  border-left-color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.sidebar-nav__item.v-list-item--active :deep(.v-icon) {
  color: rgb(var(--v-theme-primary));
}
</style>
