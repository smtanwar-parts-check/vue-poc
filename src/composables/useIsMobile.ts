import { computed } from 'vue'
import { useDisplay } from 'vuetify'

/** Single source of truth for the mobile/tablet cutoff — shared by the shell drawer and the data table's card fallback. */
export const MOBILE_BREAKPOINT_PX = 768

export function useIsMobile() {
  const { width } = useDisplay()
  return computed(() => width.value < MOBILE_BREAKPOINT_PX)
}
