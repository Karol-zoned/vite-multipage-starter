import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { glob } from 'node:fs/promises'
import tailwindcss from '@tailwindcss/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(async () => {
  const inputs = []

  for await (const entry of glob('src/**/*.html')) {
    inputs.push(resolve(__dirname, entry))
  }

  return {
    plugins: [tailwindcss()],
    root: resolve(__dirname, 'src'),
    build: {
      emptyOutDir: true,
      outDir: resolve(__dirname, 'dist'),
      rollupOptions: {
        input: inputs,
      },
    },
  }
})