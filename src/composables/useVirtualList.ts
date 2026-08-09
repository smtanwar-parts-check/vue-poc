import { computed, ref, type Ref } from 'vue'

export interface VirtualRow<T> {
  item: T
  index: number
  top: number
}

/**
 * A from-scratch fixed-height virtual list built entirely on Vue's own
 * reactivity (`ref`/`computed`) — no virtual-scroll library. Only the rows in
 * `visibleItems` are ever rendered; Vue's own keyed `v-for` diffing reuses
 * existing DOM elements for items that remain in the slice across scroll
 * events rather than recreating them, which is the same "recycle, don't
 * rebuild" behavior CDK's virtual scroll provides in the Angular build.
 */
export function useVirtualList<T>(items: Ref<T[]>, itemHeight: number, overscan = 6) {
  const scrollTop = ref(0)
  const viewportHeight = ref(0)

  const totalHeight = computed(() => items.value.length * itemHeight)

  const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan))

  const endIndex = computed(() =>
    Math.min(
      items.value.length,
      Math.ceil((scrollTop.value + viewportHeight.value) / itemHeight) + overscan,
    ),
  )

  const visibleItems = computed<VirtualRow<T>[]>(() =>
    items.value.slice(startIndex.value, endIndex.value).map((item, i) => ({
      item,
      index: startIndex.value + i,
      top: (startIndex.value + i) * itemHeight,
    })),
  )

  function onScroll(event: Event): void {
    scrollTop.value = (event.target as HTMLElement).scrollTop
  }

  function setViewportHeight(height: number): void {
    viewportHeight.value = height
  }

  return { totalHeight, visibleItems, startIndex, endIndex, scrollTop, onScroll, setViewportHeight }
}
