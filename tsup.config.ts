import { defineConfig } from 'tsup'
import packageJson from './package.json' assert { type: 'json' }

// All dependencies should be external (not bundled)
const external = [
  ...(Object.keys(packageJson.dependencies || {})),
  ...(Object.keys(packageJson.peerDependencies || {})),
]

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  external,
})
