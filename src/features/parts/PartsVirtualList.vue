<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { API_BASE_URL } from '@/core/config'
import { useVirtualList } from '@/composables/useVirtualList'
import { stockLevel } from './stockLevel'
import type { Part } from './types'

const CHUNK_SIZE = 200
/** Start fetching the next chunk once the viewport is this many rows from the end of what's loaded. */
const PREFETCH_BUFFER = 150
const ROW_HEIGHT = 48

const items = ref<Part[]>([])
const total = ref<number | null>(null)
const loadingMore = ref(false)
const initialLoading = ref(true)
const loadError = ref<string | null>(null)
let nextPage = 1

const { totalHeight, visibleItems, endIndex, onScroll, setViewportHeight } = useVirtualList(
  items,
  ROW_HEIGHT,
)

const viewportRef = ref<HTMLElement | null>(null)

async function loadNextChunk(): Promise<void> {
  const knownTotal = total.value
  if (loadingMore.value || (knownTotal !== null && items.value.length >= knownTotal)) {
    return
  }

  loadingMore.value = true
  loadError.value = null
  try {
    const url = new URL(`${API_BASE_URL}/partsBulk`)
    url.searchParams.set('_page', String(nextPage))
    url.searchParams.set('_limit', String(CHUNK_SIZE))
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`)
    }
    const totalCount = Number(response.headers.get('X-Total-Count') ?? 0)
    total.value = totalCount
    const page = (await response.json()) as Part[]
    items.value = [...items.value, ...page]
    nextPage += 1
  } catch {
    loadError.value = 'Could not load more parts. Is json-server running?'
  } finally {
    loadingMore.value = false
    initialLoading.value = false
  }
}

function onScrollWithPrefetch(event: Event): void {
  onScroll(event)
  if (endIndex.value + PREFETCH_BUFFER >= items.value.length) {
    void loadNextChunk()
  }
}

onMounted(() => {
  if (viewportRef.value) {
    setViewportHeight(viewportRef.value.clientHeight)
  }
  const onResize = () => viewportRef.value && setViewportHeight(viewportRef.value.clientHeight)
  window.addEventListener('resize', onResize)
  void loadNextChunk()
})
</script>

<template>
  <div class="virtual-list">
    <div class="virtual-list__meta">
      <span>{{ items.length.toLocaleString() }} of {{ total !== null ? total.toLocaleString() : '…' }} rows loaded</span>
      <span v-if="loadingMore" class="virtual-list__loading-label">· loading more…</span>
    </div>

    <div class="virtual-list__progress">
      <v-progress-linear v-if="initialLoading" indeterminate color="primary" />
    </div>

    <p v-if="loadError" class="virtual-list__error">{{ loadError }}</p>

    <div v-else class="virtual-list__table">
      <div class="virtual-list__row virtual-list__row--header" role="row">
        <span class="col-sku">SKU</span>
        <span class="col-name">Name</span>
        <span class="col-category">Category</span>
        <span class="col-price">Price</span>
        <span class="col-stock">Stock</span>
        <span class="col-active">Status</span>
      </div>

      <div ref="viewportRef" class="virtual-list__viewport" @scroll="onScrollWithPrefetch">
        <div class="virtual-list__spacer" :style="{ height: `${totalHeight}px` }">
          <div
            v-for="row in visibleItems"
            :key="row.item.id"
            class="virtual-list__row"
            role="row"
            :style="{ transform: `translateY(${row.top}px)` }"
          >
            <span class="col-sku">{{ row.item.sku }}</span>
            <span class="col-name">{{ row.item.name }}</span>
            <span class="col-category">{{ row.item.category }}</span>
            <span class="col-price numeric-cell">{{
              row.item.price.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
            }}</span>
            <span class="col-stock numeric-cell stock-value" :data-level="stockLevel(row.item.stock)">
              {{ row.item.stock }}
            </span>
            <span class="col-active">
              <v-chip :color="row.item.active ? 'primary' : undefined" size="small">
                {{ row.item.active ? 'Active' : 'Inactive' }}
              </v-chip>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.virtual-list__meta {
  display: flex;
  gap: 4px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-variant-numeric: tabular-nums;
}

.virtual-list__loading-label {
  color: rgb(var(--v-theme-primary));
}

.virtual-list__progress {
  height: 4px;
}

.virtual-list__error {
  color: rgb(var(--v-theme-error));
  margin: 0;
}

.virtual-list__table {
  border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}

.virtual-list__viewport {
  height: min(600px, 65vh);
  overflow-y: auto;
  position: relative;
}

.virtual-list__spacer {
  position: relative;
  width: 100%;
}

.virtual-list__row {
  display: grid;
  grid-template-columns: 14fr 30fr 16fr 12fr 10fr 14fr;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 16px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.virtual-list__row:not(.virtual-list__row--header) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.virtual-list__row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.virtual-list__row--header {
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
