import * as esbuild from 'esbuild'

const ctx = await esbuild.context({
  entryPoints: ['src/shared/shell.ts', 'src/pages/home.ts', 'src/super-word/main.ts', 'src/pages/404.ts'],
  bundle: true,
  outdir: 'public',
  format: 'esm',
  target: 'es2022',
  sourcemap: true,
  banner: {
    js: `new EventSource('/esbuild').addEventListener('change', () => location.reload());`,
  },
})

await ctx.watch()
const { host, port } = await ctx.serve({ servedir: 'public' })
console.log(`Dev server running at http://localhost:${port}`)
