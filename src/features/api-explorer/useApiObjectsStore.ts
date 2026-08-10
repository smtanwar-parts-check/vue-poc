import { computed, ref, watch } from 'vue'
import { apiObjectsApi } from '@/core/api/apiObjectsApi'
import type { ApiObject, ApiObjectInput } from '@/core/api/apiObjectsApi'
import { REMOTE_API_BASE_URL } from '@/core/config'
import { useResource } from '@/composables/useResource'

export type ApiObjectSortField = 'id' | 'name'
export type SortDirection = 'asc' | 'desc'

/**
 * Module-level state (singleton), same pattern as usePartsStore. restful-
 * api.dev ignores pagination/sort/filter query params entirely (confirmed
 * live) — so unlike usePartsStore, this fetches the full object list once
 * and does search/sort/paginate client-side over it.
 */
const searchTerm = ref('')
const sortField = ref<ApiObjectSortField>('name')
const sortDirection = ref<SortDirection>('asc')
const page = ref(1)
const pageSize = ref(10)

const saving = ref(false)
const mutationError = ref<string | null>(null)

const objectsResource = useResource<ApiObject[]>(() => ({ url: `${REMOTE_API_BASE_URL}/objects` }), {
  defaultValue: [],
})

// Verified live: GET /objects is a static seed snapshot that never reflects
// writes — a POST/PUT/DELETE succeeds and echoes back a real object (and
// GET-by-id honors it), but the collection listing itself never changes. So
// the initial fetch seeds local state once, and every mutation applies the
// API's own response directly to that local array, rather than re-fetching a
// collection that will never change.
//
// `watch` (not `watchEffect`) on purpose: `useResource`'s `isLoading` starts
// at `false` and only flips to `true` inside an async watchEffect that hasn't
// run its first pass yet, so checking "isLoading is currently false" the
// moment this module loads would seed from the empty `defaultValue` before
// the real fetch ever starts. `watch` only fires on an actual value change,
// so it only reacts to the genuine true->false transition once the fetch
// settles.
const localObjects = ref<ApiObject[] | null>(null)
watch(objectsResource.isLoading, (loading) => {
  if (!loading && localObjects.value === null) {
    localObjects.value = objectsResource.value.value ?? []
  }
})

const loading = computed(() => objectsResource.isLoading.value)
const loadError = computed(() => (objectsResource.error.value ? 'Could not reach api.restful-api.dev.' : null))

const filtered = computed(() => {
  let list = localObjects.value ?? []

  const term = searchTerm.value.trim().toLowerCase()
  if (term) {
    list = list.filter((o) => o.name.toLowerCase().includes(term))
  }

  const field = sortField.value
  const direction = sortDirection.value
  list = [...list].sort((a, b) => {
    const cmp = field === 'id' ? a.id.localeCompare(b.id) : a.name.localeCompare(b.name)
    return direction === 'asc' ? cmp : -cmp
  })

  return list
})

const total = computed(() => filtered.value.length)

const objects = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

const isEmpty = computed(() => !loading.value && !loadError.value && objects.value.length === 0)

function setSearchTerm(term: string): void {
  searchTerm.value = term
  page.value = 1
}

function setSort(field: ApiObjectSortField, direction: SortDirection): void {
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

async function mutate(action: () => Promise<void>): Promise<boolean> {
  saving.value = true
  mutationError.value = null
  try {
    await action()
    return true
  } catch (err) {
    console.error('[useApiObjectsStore] mutation failed', err)
    mutationError.value = 'That action failed — please try again.'
    return false
  } finally {
    saving.value = false
  }
}

async function createObject(payload: ApiObjectInput): Promise<boolean> {
  return mutate(async () => {
    const created = await apiObjectsApi.createObject(payload)
    localObjects.value = [...(localObjects.value ?? []), created]
  })
}

async function updateObject(id: string, payload: ApiObjectInput): Promise<boolean> {
  return mutate(async () => {
    const updated = await apiObjectsApi.updateObject(id, payload)
    localObjects.value = (localObjects.value ?? []).map((o) => (o.id === id ? updated : o))
  })
}

async function deleteObject(id: string): Promise<boolean> {
  return mutate(async () => {
    await apiObjectsApi.deleteObject(id)
    localObjects.value = (localObjects.value ?? []).filter((o) => o.id !== id)
  })
}

export function useApiObjectsStore() {
  return {
    searchTerm,
    sortField,
    sortDirection,
    page,
    pageSize,
    saving,
    mutationError,
    objects,
    loading,
    loadError,
    isEmpty,
    total,
    setSearchTerm,
    setSort,
    setPage,
    setPageSize,
    createObject,
    updateObject,
    deleteObject,
  }
}
