import { ref } from 'vue'

/**
 * Module-level refs, not per-call state — every `useNotifications()` call
 * shares the same instance, the same way an Angular `providedIn: 'root'`
 * service is a singleton. One `<v-snackbar>` rendered once in the app shell
 * (see Shell.vue) reads this shared state.
 */
const open = ref(false)
const message = ref('')
const color = ref<'success' | 'error'>('success')
const timeout = ref(3000)

function show(text: string, variant: 'success' | 'error', duration: number): void {
  message.value = text
  color.value = variant
  timeout.value = duration
  open.value = true
}

export function useNotifications() {
  return {
    open,
    message,
    color,
    timeout,
    success: (text: string) => show(text, 'success', 3000),
    error: (text: string) => show(text, 'error', 5000),
  }
}
