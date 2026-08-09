<script setup lang="ts">
import { ref } from 'vue'
import { API_BASE_URL } from '@/core/config'
import type { Supplier } from './types'

withDefaults(defineProps<{ label?: string }>(), { label: 'Preferred supplier' })

/**
 * `defineModel()` is the whole component's two-way binding story — one line
 * instead of Angular's `model()` signal *plus* an explicit `FormValueControl`
 * interface implementation to make it a real form field.
 */
const value = defineModel<string>({ default: '' })

const suggestions = ref<Supplier[]>([])
const loading = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Async autocomplete against GET /suppliers?q= — satisfies the bake-off's
 * "typeahead / autocomplete with async suggestions" requirement. Free text is
 * still accepted; suggestions are just a shortcut.
 */
function onSearchInput(term: string): void {
  clearTimeout(debounceTimer)
  const trimmed = term.trim()
  if (!trimmed) {
    suggestions.value = []
    return
  }
  debounceTimer = setTimeout(async () => {
    loading.value = true
    try {
      const url = new URL(`${API_BASE_URL}/suppliers`)
      url.searchParams.set('q', trimmed)
      const response = await fetch(url.toString())
      suggestions.value = response.ok ? await response.json() : []
    } finally {
      loading.value = false
    }
  }, 200)
}
</script>

<template>
  <v-combobox
    v-model="value"
    :label="label"
    :items="suggestions.map((s) => s.name)"
    :loading="loading"
    variant="outlined"
    density="comfortable"
    clearable
    @update:search="onSearchInput"
  />
</template>
