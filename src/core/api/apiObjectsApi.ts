import { REMOTE_API_BASE_URL } from '@/core/config'

/**
 * The shape restful-api.dev actually returns — a generic object store, not a
 * parts-shaped resource. `data` is arbitrary and varies per object upstream.
 */
export interface ApiObject {
  id: string
  name: string
  data: Record<string, unknown> | null
}

export type ApiObjectInput = Omit<ApiObject, 'id'>

const OBJECTS_URL = `${REMOTE_API_BASE_URL}/objects`

async function parseOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.json() as Promise<T>
}

/**
 * Thin data-access layer for the public restful-api.dev sandbox. No mapping
 * layer here on purpose — the API Explorer view shows this data as-is rather
 * than dressing it up as something it isn't.
 */
export const apiObjectsApi = {
  createObject(payload: ApiObjectInput): Promise<ApiObject> {
    return fetch(OBJECTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((res) => parseOrThrow<ApiObject>(res))
  },

  updateObject(id: string, payload: ApiObjectInput): Promise<ApiObject> {
    return fetch(`${OBJECTS_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((res) => parseOrThrow<ApiObject>(res))
  },

  deleteObject(id: string): Promise<void> {
    return fetch(`${OBJECTS_URL}/${id}`, { method: 'DELETE' }).then((res) => {
      if (!res.ok) {
        throw new Error(`Request failed with ${res.status}`)
      }
    })
  },
}
