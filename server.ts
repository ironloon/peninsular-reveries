import * as http from 'node:http'
import * as esbuild from 'esbuild'
import { createRequestListener } from '@remix-run/node-fetch-server'
import { createAppRouter } from './app/router.js'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

// ── esbuild watch mode: bundle client code ────────────────
const esbuildOutdir = '.dev-client'

const ctx = await esbuild.context({
  entryPoints: [
    'client/shell.ts',
    'client/home.ts',
    'client/404.ts',
    'client/mission-orbit/main.ts',
    'client/super-word/main.ts',
    'client/chompers/main.ts',
    'client/pixel-passport/main.ts',
  ],
  bundle: true,
  outdir: esbuildOutdir,
  format: 'esm',
  target: 'es2022',
  sourcemap: true,
})

await ctx.watch()
console.log('esbuild watching client code...')

// ── SSE clients for live reload ───────────────────────────
const sseClients = new Set<http.ServerResponse>()

// Watch for source changes to trigger reload
const { watch } = await import('node:fs')
for (const dir of ['app', 'client', 'public']) {
  watch(dir, { recursive: true }, () => {
    for (const client of sseClients) {
      client.write('data: change\n\n')
    }
  })
}

// ── Request handler ───────────────────────────────────────
const router = createAppRouter()

const LIVE_RELOAD_SCRIPT = `<script>new EventSource('/__reload').addEventListener('message', () => location.reload());</script>`

function cacheControlHeader(ext: string): string {
  if (ext === '.html' || ext === '.css' || ext === '.js' || ext === '.mjs' || ext === '.json' || ext === '.woff2') {
    return 'no-cache'
  }

  return 'public, max-age=600'
}

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)

  // SSE endpoint for live reload
  if (url.pathname === '/__reload') {
    // Handled separately in raw http handler below
    return new Response(null, { status: 204 })
  }

  // Try serving esbuild output (client JS)
  if (url.pathname.startsWith('/client/')) {
    const filePath = join(esbuildOutdir, url.pathname.slice('/client/'.length))
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const ext = extname(filePath)
      return new Response(readFileSync(filePath), {
        headers: {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': cacheControlHeader(ext),
        },
      })
    }
  }

  // Try serving static files from public/
  {
    const filePath = join('public', url.pathname)
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const ext = extname(filePath)
      return new Response(readFileSync(filePath), {
        headers: {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': cacheControlHeader(ext),
        },
      })
    }
  }

  // Try the router (server-generated HTML)
  const response = await router.fetch(request)
  if (response.status !== 404 || url.pathname === '/404.html') {
    // Inject live reload script into HTML responses
    const contentType = response.headers.get('Content-Type') || ''
    if (contentType.includes('text/html')) {
      const body = await response.text()
      const injected = body.replace('</body>', `${LIVE_RELOAD_SCRIPT}\n</body>`)
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'no-cache')
      return new Response(injected, {
        status: response.status,
        headers,
      })
    }
    return response
  }

  // Fall through to 404
  const notFoundResponse = await router.fetch(new Request('http://localhost/404.html'))
  const body = await notFoundResponse.text()
  const injected = body.replace('</body>', `${LIVE_RELOAD_SCRIPT}\n</body>`)
  return new Response(injected, {
    status: 404,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    },
  })
}

// ── HTTP server with SSE support ──────────────────────────
const listener = createRequestListener(handler)

const server = http.createServer((req, res) => {
  // Handle SSE for live reload separately (needs raw response)
  if (req.url === '/__reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })
    sseClients.add(res)
    req.on('close', () => sseClients.delete(res))
    return
  }

  listener(req, res)
})

const PORT = parseInt(process.env.PORT || '3000', 10)
server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`)
})
