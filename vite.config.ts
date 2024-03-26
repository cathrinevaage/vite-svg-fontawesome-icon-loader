import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dts()],
  build: {
    ssr: true,
    target: 'esnext',
    lib: {
      formats: ['es'],
      entry: resolve(__dirname, 'lib/index.ts'),
    },
  },
})
