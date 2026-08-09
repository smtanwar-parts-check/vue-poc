<script setup lang="ts">
import { ref, watch } from 'vue'
import { PART_CATEGORIES, type CategoryFilter } from './types'
import { usePartsStore } from './usePartsStore'

const store = usePartsStore()
const categories: CategoryFilter[] = ['All', ...PART_CATEGORIES]

const searchInput = ref(store.searchTerm.value)
let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (term) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => store.setSearchTerm(term), 250)
})
</script>

<template>
  <div class="filter-bar">
    <v-text-field
      v-model="searchInput"
      label="Search SKU or name"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="comfortable"
      clearable
      hide-details
      class="filter-bar__search"
    />
    <v-select
      :model-value="store.category.value"
      :items="categories"
      label="Category"
      variant="outlined"
      density="comfortable"
      hide-details
      class="filter-bar__category"
      @update:model-value="store.setCategory($event)"
    />
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.filter-bar__search {
  flex: 1 1 260px;
  min-width: 0;
}

.filter-bar__category {
  flex: 0 1 200px;
  min-width: 160px;
}

@media (max-width: 599px) {
  .filter-bar {
    flex-direction: column;
  }

  /* Same flexbox trap as the Angular build: a flex-basis meant as a width
     under row direction silently becomes a height once the container flips
     to column — reset explicitly rather than rediscover it. */
  .filter-bar__search,
  .filter-bar__category {
    flex: 0 0 auto;
    width: 100%;
  }
}
</style>
