<script setup lang="ts">
import { ref, watch } from 'vue'
import ApiObjectsTable from './ApiObjectsTable.vue'
import ApiObjectFormDialog from './ApiObjectFormDialog.vue'
import ConfirmDialog from '@/shared/ConfirmDialog.vue'
import { useNotifications } from '@/shared/useNotifications'
import { useApiObjectsStore } from './useApiObjectsStore'
import type { ApiObject } from '@/core/api/apiObjectsApi'

const store = useApiObjectsStore()
const notifications = useNotifications()

const searchInput = ref(store.searchTerm.value)
let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (term) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => store.setSearchTerm(term), 250)
})

const formDialogOpen = ref(false)
const editingObject = ref<ApiObject | undefined>(undefined)
// Same forced-fresh-instance pattern as PartFormDialog — v-if + a bumped
// :key gives every dialog open a fresh component instance.
const dialogKey = ref(0)

const objectPendingDelete = ref<ApiObject | null>(null)

function openAddDialog(): void {
  editingObject.value = undefined
  dialogKey.value += 1
  formDialogOpen.value = true
}

function openEditDialog(object: ApiObject): void {
  editingObject.value = object
  dialogKey.value += 1
  formDialogOpen.value = true
}

function requestDelete(object: ApiObject): void {
  objectPendingDelete.value = object
}

async function confirmDelete(): Promise<void> {
  const object = objectPendingDelete.value
  if (!object) return

  const ok = await store.deleteObject(object.id)
  if (ok) {
    notifications.success('Object deleted')
  } else {
    notifications.error('Could not delete that object.')
  }
  objectPendingDelete.value = null
}
</script>

<template>
  <div class="page">
    <p class="page__note">
      Connects to a public demo API (<strong>api.restful-api.dev</strong>) — the 13 rows below are
      its fixed shared seed data. Real creates/edits/deletes succeed against the live API, but its
      collection listing never reflects writes (verified directly), so this page tracks your own
      changes locally for this session only — reload the page and they're gone. Unauthenticated use
      is capped at 50 requests/day.
    </p>

    <div class="page__toolbar">
      <v-text-field
        v-model="searchInput"
        label="Search by name"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        clearable
        hide-details
        class="page__search"
      />

      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openAddDialog"> Add object </v-btn>
    </div>

    <ApiObjectsTable @edit="openEditDialog" @delete="requestDelete" />

    <ApiObjectFormDialog v-if="formDialogOpen" :key="dialogKey" v-model="formDialogOpen" :object="editingObject" />

    <ConfirmDialog
      :model-value="!!objectPendingDelete"
      title="Delete object?"
      :message="
        objectPendingDelete
          ? `This permanently removes &quot;${objectPendingDelete.name}&quot; (ID ${objectPendingDelete.id}) from the shared restful-api.dev sandbox.`
          : ''
      "
      confirm-label="Delete"
      destructive
      @update:model-value="!$event && (objectPendingDelete = null)"
      @confirm="confirmDelete"
      @cancel="objectPendingDelete = null"
    />
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page__note {
  margin: 0;
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.875rem;
}

.page__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.page__search {
  flex: 1 1 320px;
  min-width: 0;
}

@media (max-width: 599px) {
  .page__toolbar {
    flex-direction: column;
  }

  .page__search {
    flex: 0 0 auto;
    width: 100%;
  }
}
</style>
