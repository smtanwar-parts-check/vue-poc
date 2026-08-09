import { computed, ref } from 'vue'
import { partsApi } from '@/core/api/partsApi'
import { API_BASE_URL } from '@/core/config'
import { useResource } from '@/composables/useResource'
import { buildPartsQueryParams } from './usePartsQuery'
import type { CategoryFilter, Part, PartInput, PartSortField, SortDirection } from './types'

/**
 * Module-level state, not created fresh per call — every `usePartsStore()`
 * caller shares the same refs, the same way an Angular `providedIn: 'root'`
 * service is a singleton. This is the plain-composable equivalent of a store,
 * deliberately not Pinia — a single CRUD screen doesn't earn that dependency
 * (same call as skipping NgRx on the Angular side).
 */
const searchTerm = ref('')
const category = ref<CategoryFilter>('All')
const sortField = ref<PartSortField>('name')
const sortDirection = ref<SortDirection>('asc')
const page = ref(1)
const pageSize = ref(10)

const saving = ref(false)
const mutationError = ref<string | null>(null)

const partsResource = useResource<Part[]>(
  () => ({
    url: `${API_BASE_URL}/parts`,
    params: buildPartsQueryParams({
      page: page.value,
      pageSize: pageSize.value,
      sortField: sortField.value,
      sortDirection: sortDirection.value,
      searchTerm: searchTerm.value,
      category: category.value,
    }),
  }),
  { defaultValue: [] },
)

const parts = computed(() => partsResource.value.value ?? [])
const loading = computed(() => partsResource.isLoading.value)
const loadError = computed(() =>
  partsResource.error.value ? 'Could not reach the parts API. Is json-server running?' : null,
)
const isEmpty = computed(() => !loading.value && !loadError.value && parts.value.length === 0)
const total = computed(() => {
  const header = partsResource.headers.value?.get('X-Total-Count')
  return header ? Number(header) : parts.value.length
})

function setSearchTerm(term: string): void {
  searchTerm.value = term
  page.value = 1
}

function setCategory(value: CategoryFilter): void {
  category.value = value
  page.value = 1
}

function setSort(field: PartSortField, direction: SortDirection): void {
  sortField.value = field
  sortDirection.value = direction
}

function setPage(value: number): void {
  page.value = value
}

function setPageSize(size: number): void {
  pageSize.value = size
  page.value = 1
}

async function mutate(request: () => Promise<unknown>): Promise<boolean> {
  saving.value = true
  mutationError.value = null
  try {
    await request()
    partsResource.reload()
    return true
  } catch (err) {
    console.error('[usePartsStore] mutation failed', err)
    mutationError.value = 'That action failed — please try again.'
    return false
  } finally {
    saving.value = false
  }
}

async function createPart(payload: PartInput): Promise<boolean> {
  return mutate(() => partsApi.createPart(payload))
}

async function updatePart(id: string, payload: PartInput): Promise<boolean> {
  return mutate(() => partsApi.updatePart(id, payload))
}

async function deletePart(id: string): Promise<boolean> {
  return mutate(() => partsApi.deletePart(id))
}

export function usePartsStore() {
  return {
    searchTerm,
    category,
    sortField,
    sortDirection,
    page,
    pageSize,
    saving,
    mutationError,
    parts,
    loading,
    loadError,
    isEmpty,
    total,
    setSearchTerm,
    setCategory,
    setSort,
    setPage,
    setPageSize,
    createPart,
    updatePart,
    deletePart,
  }
}
