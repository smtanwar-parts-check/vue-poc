<script setup lang="ts">
import { ref, watch } from 'vue'
import { useIsMobile } from '@/composables/useIsMobile'
import { useApiObjectsStore, type ApiObjectSortField, type SortDirection } from './useApiObjectsStore'
import type { ApiObject } from '@/core/api/apiObjectsApi'

defineEmits<{ edit: [object: ApiObject]; delete: [object: ApiObject] }>()

const store = useApiObjectsStore()
const isMobile = useIsMobile()

const headers = [
  { title: 'ID', key: 'id', width: '14%' },
  { title: 'Name', key: 'name', width: '30%' },
  { title: 'Data', key: 'data', width: '44%', sortable: false },
  { title: '', key: 'actions', width: '12%', sortable: false },
]

// Same 150ms-delayed loading indicator as PartsTable — avoids the
// instant-flash flicker on fast responses.
const showLoadingIndicator = ref(false)
let loadingDelay: ReturnType<typeof setTimeout> | undefined
watch(store.loading, (isLoading) => {
  clearTimeout(loadingDelay)
  if (isLoading) {
    loadingDelay = setTimeout(() => (showLoadingIndicator.value = true), 150)
  } else {
    showLoadingIndicator.value = false
  }
})

function previewData(data: Record<string, unknown> | null): string {
  if (!data) {
    return '—'
  }
  const entries = Object.entries(data).map(([key, value]) => `${key}: ${value}`)
  const joined = entries.join(', ')
  return joined.length > 60 ? `${joined.slice(0, 57)}…` : joined
}

interface TableOptions {
  page: number
  itemsPerPage: number
  sortBy: { key: string; order: 'asc' | 'desc' }[]
}

function onOptionsUpdate(options: TableOptions): void {
  if (options.itemsPerPage !== store.pageSize.value) {
    store.setPageSize(options.itemsPerPage)
    return
  }
  if (options.page !== store.page.value) {
    store.setPage(options.page)
  }
  const sort = options.sortBy[0]
  if (sort && (sort.key !== store.sortField.value || sort.order !== store.sortDirection.value)) {
    store.setSort(sort.key as ApiObjectSortField, sort.order as SortDirection)
  }
}
</script>

<template>
  <div class="objects-table">
    <div class="objects-table__progress">
      <v-progress-linear v-if="showLoadingIndicator" indeterminate color="primary" />
    </div>

    <div class="objects-table__content" :class="{ 'objects-table__content--revalidating': showLoadingIndicator }">
      <div v-if="store.loadError.value" class="state-message state-message--error">
        <v-icon icon="mdi-cloud-off-outline" size="40" />
        <p>{{ store.loadError.value }}</p>
      </div>

      <div v-else-if="store.isEmpty.value" class="state-message">
        <v-icon icon="mdi-earth" size="40" />
        <p>No objects match your search.</p>
      </div>

      <div v-else-if="isMobile" class="objects-cards">
        <v-card v-for="object in store.objects.value" :key="object.id" variant="outlined" class="object-card">
          <v-card-item>
            <v-card-title>{{ object.name }}</v-card-title>
            <v-card-subtitle>ID {{ object.id }}</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <p class="object-card__data">{{ previewData(object.data) }}</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" size="small" @click="$emit('edit', object)">Edit</v-btn>
            <v-btn variant="text" size="small" color="error" @click="$emit('delete', object)">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </div>

      <v-data-table-server
        v-else
        class="objects-table__grid"
        :headers="headers"
        :items="store.objects.value"
        :items-length="store.total.value"
        :items-per-page="store.pageSize.value"
        :page="store.page.value"
        :sort-by="[{ key: store.sortField.value, order: store.sortDirection.value }]"
        :items-per-page-options="[10, 25, 50]"
        item-value="id"
        @update:options="onOptionsUpdate"
      >
        <template #item.data="{ item }">
          <span :title="previewData(item.data)">{{ previewData(item.data) }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            variant="text"
            size="small"
            :aria-label="`Edit ${item.name}`"
            @click="$emit('edit', item)"
          />
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            :aria-label="`Delete ${item.name}`"
            @click="$emit('delete', item)"
          />
        </template>
      </v-data-table-server>
    </div>
  </div>
</template>

<style scoped>
.objects-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.objects-table__progress {
  height: 4px;
}

.objects-table__content {
  transition: opacity 150ms ease;
}

.objects-table__content--revalidating {
  opacity: 0.6;
}

.objects-table__grid {
  border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.objects-table__grid :deep(table) {
  table-layout: fixed;
}

.objects-table__grid :deep(td),
.objects-table__grid :deep(th) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.state-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: clamp(32px, 8vw, 64px) 16px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-align: center;
}

.state-message--error {
  color: rgb(var(--v-theme-error));
}

.objects-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.object-card__data {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.875rem;
  margin: 0;
}
</style>
