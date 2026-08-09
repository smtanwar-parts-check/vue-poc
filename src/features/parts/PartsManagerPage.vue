<script setup lang="ts">
import { ref } from 'vue'
import PartsFilterBar from './PartsFilterBar.vue'
import PartsTable from './PartsTable.vue'
import PartsVirtualList from './PartsVirtualList.vue'
import PartFormDialog from './PartFormDialog.vue'
import ConfirmDialog from '@/shared/ConfirmDialog.vue'
import { useNotifications } from '@/shared/useNotifications'
import { usePartsStore } from './usePartsStore'
import type { Part } from './types'

type ViewMode = 'paged' | 'virtual'

const store = usePartsStore()
const notifications = useNotifications()
const viewMode = ref<ViewMode>('paged')

const formDialogOpen = ref(false)
const editingPart = ref<Part | undefined>(undefined)
// PartFormDialog captures its initial values once, in VeeValidate's
// useForm(), at component-mount time — since the dialog stays in the tree
// (visibility just toggles via v-model), reopening it for a *different* part
// without remounting would leave stale initial values from whichever part it
// last mounted with. Forcing v-if + a bumped :key gives every open a fresh
// component instance, mirroring Angular's MatDialog.open() semantics, which
// always constructs a brand-new instance per call.
const dialogKey = ref(0)

const partPendingDelete = ref<Part | null>(null)

function openAddDialog(): void {
  editingPart.value = undefined
  dialogKey.value += 1
  formDialogOpen.value = true
}

function openEditDialog(part: Part): void {
  editingPart.value = part
  dialogKey.value += 1
  formDialogOpen.value = true
}

function requestDelete(part: Part): void {
  partPendingDelete.value = part
}

async function confirmDelete(): Promise<void> {
  const part = partPendingDelete.value
  if (!part) return

  const ok = await store.deletePart(part.id)
  if (ok) {
    notifications.success('Part deleted')
  } else {
    notifications.error('Could not delete that part.')
  }
  partPendingDelete.value = null
}
</script>

<template>
  <div class="page">
    <div class="page__toolbar">
      <PartsFilterBar v-if="viewMode === 'paged'" class="page__filters" />
      <p v-else class="page__virtual-note">
        A synthetic 5,000-row dataset, browsed independently of the parts above — demonstrates a
        from-scratch virtual scroll built on Vue's own reactivity.
      </p>

      <v-btn-toggle v-model="viewMode" color="primary" variant="outlined" density="comfortable" mandatory>
        <v-btn value="paged">Paged</v-btn>
        <v-btn value="virtual">Virtual scroll</v-btn>
      </v-btn-toggle>

      <v-btn
        v-if="viewMode === 'paged'"
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        @click="openAddDialog"
      >
        Add part
      </v-btn>
    </div>

    <PartsTable v-if="viewMode === 'paged'" @edit="openEditDialog" @delete="requestDelete" />
    <PartsVirtualList v-else />

    <PartFormDialog v-if="formDialogOpen" :key="dialogKey" v-model="formDialogOpen" :part="editingPart" />

    <ConfirmDialog
      :model-value="!!partPendingDelete"
      title="Delete part?"
      :message="
        partPendingDelete
          ? `This permanently removes &quot;${partPendingDelete.name}&quot; (${partPendingDelete.sku}).`
          : ''
      "
      confirm-label="Delete"
      destructive
      @update:model-value="!$event && (partPendingDelete = null)"
      @confirm="confirmDelete"
      @cancel="partPendingDelete = null"
    />
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page__toolbar {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.page__filters {
  flex: 1 1 320px;
  min-width: 0;
}

.page__virtual-note {
  flex: 1 1 320px;
  min-width: 0;
  margin: 0;
  align-self: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

@media (max-width: 599px) {
  .page__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  /* Same flex-basis-under-column trap as elsewhere — reset explicitly. */
  .page__filters,
  .page__virtual-note {
    flex: 0 0 auto;
  }
}
</style>
