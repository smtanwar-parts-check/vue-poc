import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify, type ThemeDefinition } from 'vuetify'

/**
 * PartsCheck brand theme — same hex values used in the Angular build, carried
 * over verbatim (see PARTSCHECK-BAKEOFF-NOTES.md §5). Vuetify's color model is
 * flatter than Angular Material's M3 (no tonal "container" roles), so brand
 * blue maps to `secondary`/`info` and the low-stock indicator uses Vuetify's
 * own `warning` role directly instead of a bespoke token.
 */
const light: ThemeDefinition = {
  dark: false,
  colors: {
    // AA-contrast-checked against white text — the raw brand green (#12A537)
    // is only ~3.25:1 with white, below the 4.5:1 text threshold.
    primary: '#0E8A2E',
    secondary: '#0078AA',
    info: '#0078AA',
    success: '#0E8A2E',
    warning: '#7A4A00',
    error: '#BA1A1A',
    background: '#FAFAF8',
    surface: '#FFFFFF',
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'on-warning': '#FFFFFF',
  },
  variables: {
    // Decorative-only brand hues for use next to the real logo, where the
    // AA-safe primary would look duller than the mark itself.
    'pc-brand-green': '#12A537',
    'pc-brand-gold': '#F7941D',
    'pc-warning-container': '#FFF1DB',
  },
}

const dark: ThemeDefinition = {
  dark: true,
  colors: {
    primary: '#6FDB8B',
    secondary: '#7FD4F0',
    info: '#7FD4F0',
    success: '#6FDB8B',
    warning: '#FFD180',
    error: '#FFB4AB',
    background: '#121611',
    surface: '#1D211A',
    'on-primary': '#06350F',
    'on-secondary': '#003244',
    'on-warning': '#4D3300',
  },
  variables: {
    'pc-brand-green': '#12A537',
    'pc-brand-gold': '#F7941D',
    'pc-warning-container': '#4D3300',
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'system',
    themes: { light, dark },
  },
})
