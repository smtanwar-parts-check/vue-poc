import { API_BASE_URL } from '@/core/config'
import type { Part, PartInput } from '@/features/parts/types'

const PARTS_URL = `${API_BASE_URL}/parts`

async function parseOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json() as Promise<T>
}

/**
 * Thin data-access layer — the only place that knows the mock API's shape.
 * Components and the store never call fetch() directly.
 */
export const partsApi = {
  createPart(payload: PartInput): Promise<Part> {
    return fetch(PARTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, updatedAt: new Date().toISOString() }),
    }).then((res) => parseOrThrow<Part>(res))
  },

  updatePart(id: string, payload: PartInput): Promise<Part> {
    return fetch(`${PARTS_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, id, updatedAt: new Date().toISOString() }),
    }).then((res) => parseOrThrow<Part>(res))
  },

  deletePart(id: string): Promise<void> {
    return fetch(`${PARTS_URL}/${id}`, { method: 'DELETE' }).then((res) => {
      if (!res.ok) {
        throw new Error(`Request failed with ${res.status}`)
      }
    })
  },

  /** Exact-match lookup used by the SKU-uniqueness async validator — checks the full dataset, not just one page. */
  async checkSkuExists(sku: string, excludeId?: string): Promise<boolean> {
    const url = new URL(PARTS_URL)
    url.searchParams.set('sku', sku)
    const matches = await parseOrThrow<Part[]>(await fetch(url.toString()))
    return matches.some((part) => part.id !== excludeId)
  },
}
