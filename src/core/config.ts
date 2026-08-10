/**
 * Single point of change for the backend origin. Swapping the mock json-server
 * for a real API later means editing this one constant, nothing else.
 */
export const API_BASE_URL = 'http://localhost:8000'

/** The public restful-api.dev sandbox backing the API Explorer view — a generic object store, unrelated to the parts domain. */
export const REMOTE_API_BASE_URL = 'https://api.restful-api.dev'
