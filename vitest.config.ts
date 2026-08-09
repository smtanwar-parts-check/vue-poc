import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./src/test-setup.ts'],
      // Vuetify's components import their own .css files (e.g. VBtn.css);
      // without this, Vitest's native Node loader chokes on that extension.
      // Forcing it through Vite's transform pipeline instead handles it.
      server: {
        deps: {
          inline: ['vuetify'],
        },
      },
    },
  }),
)
