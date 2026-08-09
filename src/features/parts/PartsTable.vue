<script setup lang="ts">
import { ref, watch } from 'vue'
import { useIsMobile } from '@/composables/useIsMobile'
import { usePartsStore } from './usePartsStore'
import { stockLevel } from './stockLevel'
import type { Part, PartSortField, SortDirection } from './types'

defineEmits<{ edit: [part: Part]; delete: [part: Part] }>()

const store = usePartsStore()
const isMobile = useIsMobile()

const headers = [
  { title: 'SKU', key: 'sku', width: '12%' },
  { title: 'Name', key: 'name', width: '28%' },
  { title: 'Category', key: 'category', width: '14%' },
  { title: 'Price', key: 'price', width: '12%' },
  { title: 'Stock', key: 'stock', width: '10%' },
  { title: 'Status', key: 'active', width: '12%', sortable: false },
  { title: '', key: 'actions', width: '12%', sortable: false },
]

// json-server responds in single-digit ms locally — an instant show/hide of
// a loading indicator reads as a flicker, not a helpful cue. Same 150ms
// delayed-indicator fix as the Angular build.
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
    store.setSort(sort.key as PartSortField, sort.order as SortDirection)
  }
}
</script>

<template>
  <div class="parts-table">
    <div class="parts-table__progress">
      <v-progress-linear v-if="showLoadingIndicator" indeterminate color="primary" />
    </div>

    <div class="parts-table__content" :class="{ 'parts-table__content--revalidating': showLoadingIndicator }">
      <div v-if="store.loadError.value" class="state-message state-message--error">
        <v-icon icon="mdi-cloud-off-outline" size="40" />
        <p>{{ store.loadError.value }}</p>
      </div>

      <div v-else-if="store.isEmpty.value" class="state-message">
        <v-icon icon="mdi-package-variant" size="40" />
        <p>No parts match your filters.</p>
      </div>

      <div v-else-if="isMobile" class="parts-cards">
        <v-card v-for="part in store.parts.value" :key="part.id" variant="outlined" class="part-card">
          <v-card-item>
            <v-card-title>{{ part.name }}</v-card-title>
            <v-card-subtitle>{{ part.sku }} · {{ part.category }}</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <div class="part-card__row">
              <span>Price</span>
              <strong class="numeric-cell">{{
                part.price.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
              }}</strong>
            </div>
            <div class="part-card__row">
              <span>Stock</span>
              <strong class="stock-value" :data-level="stockLevel(part.stock)">{{ part.stock }}</strong>
            </div>
            <div class="part-card__row">
              <span>Status</span>
              <v-chip :color="part.active ? 'primary' : undefined" size="small">
                {{ part.active ? 'Active' : 'Inactive' }}
              </v-chip>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" size="small" @click="$emit('edit', part)">Edit</v-btn>
            <v-btn variant="text" size="small" color="error" @click="$emit('delete', part)">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </div>

      <v-data-table-server
        v-else
        class="parts-table__grid"
        :headers="headers"
        :items="store.parts.value"
        :items-length="store.total.value"
        :items-per-page="store.pageSize.value"
        :page="store.page.value"
        :sort-by="[{ key: store.sortField.value, order: store.sortDirection.value }]"
        :items-per-page-options="[10, 25, 50]"
        item-value="id"
        @update:options="onOptionsUpdate"
      >
        <template #item.price="{ item }">
          <span class="numeric-cell">{{
            item.price.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
          }}</span>
        </template>
        <template #item.stock="{ item }">
          <span class="stock-value" :data-level="stockLevel(item.stock)">{{ item.stock }}</span>
        </template>
        <template #item.active="{ item }">
          <v-chip :color="item.active ? 'primary' : undefined" size="small">
            {{ item.active ? 'Active' : 'Inactive' }}
          </v-chip>
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
.parts-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.parts-table__progress {
  height: 4px;
}

.parts-table__content {
  transition: opacity 150ms ease;
}

.parts-table__content--revalidating {
  opacity: 0.6;
}

.parts-table__grid {
  border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Same lesson as the Angular build: v-data-table renders a real <table>, and
   the default auto layout resizes every column from whatever content is on
   screen — different pages have different name/SKU lengths, so columns
   visibly reflow on every navigation. Fixed layout + explicit widths (set on
   the headers above) keeps every boundary stable. */
.parts-table__grid :deep(table) {
  table-layout: fixed;
}

.parts-table__grid :deep(td),
.parts-table__grid :deep(th) {
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

.parts-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.part-card__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.part-card__row span {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.875rem;
}
</style>
