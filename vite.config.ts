/**
 * 配置 Vite 应用构建及 Vitest 测试。
 * Configures Vite builds and Vitest.
 */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // Relative base: the build can be served from any path or sub-directory
  // (GitHub Pages project sites, NAS, a folder on an existing site).
  base: './',
  plugins: [react()],
  test: {
    // Core modules are plain TypeScript and run in Node. Tests that need a DOM
    // opt in per file with `// @vitest-environment happy-dom`.
    environment: 'node',
  },
})
