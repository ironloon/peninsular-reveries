import * as esbuild from 'esbuild'
import { cpSync, rmSync } from 'node:fs'

// Clean output
rmSync('dist', { recursive: true, force: true })

// Copy static assets verbatim
cpSync('public', 'dist', { recursive: true })

// Bundle TypeScript entry points
await esbuild.build({
  entryPoints: ['src/shared/shell.ts', 'src/pages/home.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  target: 'es2022',
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
})
