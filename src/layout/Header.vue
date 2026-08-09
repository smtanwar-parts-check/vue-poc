<script setup lang="ts">
defineEmits<{ toggleNav: [] }>()
</script>

<template>
  <v-app-bar :elevation="0" color="surface" class="app-header">
    <v-app-bar-nav-icon @click="$emit('toggleNav')" aria-label="Toggle navigation" />

    <span class="app-header__brand">
      <img src="/brand/partscheck-logo.png" alt="PartsCheck" class="app-header__logo" />
    </span>
    <span class="app-header__title">Parts Manager</span>

    <v-spacer />

    <v-menu>
      <template #activator="{ props }">
        <v-btn icon="mdi-account-circle" variant="text" v-bind="props" aria-label="User menu" />
      </template>
      <v-list density="compact">
        <v-list-item disabled prepend-icon="mdi-account" title="Signed in as Admin" />
        <v-divider />
        <v-list-item disabled prepend-icon="mdi-logout" title="Sign out" />
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<style scoped>
.app-header {
  /* Thin brand rail: ties the header to the identity without painting the
     whole bar — same rationale as the Angular build. */
  border-bottom: 3px solid rgb(var(--v-pc-brand-green));
}

.app-header__brand {
  display: flex;
  align-items: center;
}

.app-header__logo {
  height: 26px;
  width: auto;
  display: block;
}

.app-header__title {
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgba(var(--v-theme-on-surface), 0.7);
  font: 600 22px/28px 'Barlow Semi Condensed', sans-serif;
  white-space: nowrap;
}

@media (max-width: 479px) {
  .app-header__title {
    display: none;
  }
}
</style>
