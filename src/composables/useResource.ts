import { ref, shallowRef, watchEffect, type Ref } from 'vue'

export interface ResourceRequest {
  url: string
  params?: Record<string, string | number>
}

export interface Resource<T> {
  value: Ref<T>
  isLoading: Ref<boolean>
  error: Ref<unknown>
  headers: Ref<Headers | undefined>
  reload: () => void
}

/**
 * Vue's answer to Angular's `httpResource()` — reactive fetch with zero extra
 * dependencies. `requestFn` is called synchronously at the top of the
 * `watchEffect`, so any refs/reactive state it reads (query params, filters,
 * sort state) become tracked dependencies automatically: change one, this
 * refetches. Returning `undefined` from `requestFn` skips the request
 * entirely (mirrors httpResource's same convention).
 */
export function useResource<T>(
  requestFn: () => ResourceRequest | undefined,
  options: { defaultValue: T },
): Resource<T> {
  const value = ref(options.defaultValue) as Ref<T>
  const isLoading = ref(false)
  const error = ref<unknown>(null)
  const headers = shallowRef<Headers>()
  const reloadTrigger = ref(0)

  watchEffect(async () => {
    const request = requestFn()
    // Read as a dependency so reload() can force a refetch even when the
    // request shape itself hasn't changed (e.g. after a mutation).
    void reloadTrigger.value

    if (!request) {
      return
    }

    isLoading.value = true
    error.value = null
    try {
      const url = new URL(request.url)
      for (const [key, val] of Object.entries(request.params ?? {})) {
        url.searchParams.set(key, String(val))
      }
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`)
      }
      headers.value = response.headers
      value.value = await response.json()
    } catch (err) {
      error.value = err
    } finally {
      isLoading.value = false
    }
  })

  function reload(): void {
    reloadTrigger.value += 1
  }

  return { value, isLoading, error, headers, reload }
}
