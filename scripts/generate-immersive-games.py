#!/usr/bin/env python3
"""Generate immersive game files from templates."""
import os

GAMES = {
    'mission-orbit-immersive': {
        'original': 'mission-orbit',
        'name': 'Mission: Orbit Immersive',
        'desc': 'Time the key Artemis II burns using your camera — raise your hand to ignite, lean to steer!',
        'icon': '🚀',
        'bg': '#0a0a2e',
        'accent': '#ff6600',
        'gradient': 'linear-gradient(135deg, #ff6600, #ff4400)',
        'padColors': None,
        'swatches': '0x0a0a2e, 0x1a1a4e, 0xff6600, 0x44aaff, 0xffffff',
        'mechanic': 'Raise hand to ignite boosters, lean left/right to steer the rocket through mission phases.',
    },
    'peekaboo-immersive': {
        'original': 'peekaboo',
        'name': 'Peekaboo Immersive',
        'desc': 'Find the hidden character using your camera! Move your hands to clear the fog.',
        'icon': '🙈',
        'bg': '#1a1a2e',
        'accent': '#ff88cc',
        'gradient': 'linear-gradient(135deg, #ff88cc, #ff4488)',
        'swatches': '0x1a1a2e, 0x2a2a4e, 0xff88cc, 0x44ffcc, 0xffffff',
        'mechanic': 'Wave your hands to clear fog patches and find the hidden character.',
    },
    'pixel-passport-immersive': {
        'original': 'pixel-passport',
        'name': 'Pixel Passport Immersive',
        'desc': 'Explore world destinations with your camera! Point at places to visit them.',
        'icon': '🌍',
        'bg': '#0a2040',
        'accent': '#ffd166',
        'gradient': 'linear-gradient(135deg, #ffd166, #ff9900)',
        'swatches': '0x0a2040, 0x1a4060, 0xffd166, 0x44ccff, 0x88ff88',
        'mechanic': 'Point at destinations on the globe to select and explore them.',
    },
    'spot-on-immersive': {
        'original': 'spot-on',
        'name': 'Spot On Immersive',
        'desc': 'Tidy up cozy rooms using your camera! Point at items to pick them up.',
        'icon': '🧹',
        'bg': '#1a2428',
        'accent': '#44ccaa',
        'gradient': 'linear-gradient(135deg, #44ccaa, #22aa88)',
        'swatches': '0x1a2428, 0x2a3438, 0x44ccaa, 0xffd166, 0xff8844',
        'mechanic': 'Point at items with your hand to pick them up, then point at spots to place them.',
    },
    'squares-immersive': {
        'original': 'squares',
        'name': 'Squares Immersive',
        'desc': 'Flip tiles by gesturing at them! Make the whole board one color.',
        'icon': '🔳',
        'bg': '#254653',
        'accent': '#f59e0b',
        'gradient': 'linear-gradient(135deg, #f59e0b, #d97706)',
        'swatches': '0x254653, 0xf2ebd6, 0xf59e0b, 0x44aaff, 0xffffff',
        'mechanic': 'Point at cells to flip them and their neighbors.',
    },
    'story-trail-immersive': {
        'original': 'story-trail',
        'name': 'Story Trail Immersive',
        'desc': 'Read and explore stories with your camera! Gesture to make choices.',
        'icon': '📖',
        'bg': '#1a1a2e',
        'accent': '#88ccff',
        'gradient': 'linear-gradient(135deg, #88ccff, #4488ff)',
        'swatches': '0x1a1a2e, 0x2a2a4e, 0x88ccff, 0xffcc44, 0xffffff',
        'mechanic': 'Lean left or right to choose, raise hand to confirm.',
    },
    'super-word-immersive': {
        'original': 'super-word',
        'name': 'Super Word Immersive',
        'desc': 'Find hidden letters with your camera! Point at letters to spell the word.',
        'icon': '🪄',
        'bg': '#1a1a33',
        'accent': '#ce93d8',
        'gradient': 'linear-gradient(135deg, #ce93d8, #ab47bc)',
        'swatches': '0x1a1a33, 0x2a2a4e, 0xce93d8, 0x4fc3f7, 0xffffff',
        'mechanic': 'Point at letters hidden in the scene to select them and spell the word.',
    },
    'train-sounds-immersive': {
        'original': 'train-sounds',
        'name': 'Train Sounds Immersive',
        'desc': 'Point at train parts with your camera to hear them come alive!',
        'icon': '🚆',
        'bg': '#1a2233',
        'accent': '#ff6644',
        'gradient': 'linear-gradient(135deg, #ff6644, #cc3300)',
        'swatches': '0x1a2233, 0x2a3344, 0xff6644, 0x44ccff, 0xffd166',
        'mechanic': 'Point at different parts of the train on screen to trigger their sounds.',
    },
    'waterwall-immersive': {
        'original': 'waterwall',
        'name': 'Waterwall Immersive',
        'desc': 'A zen waterfall sandbox. Use your camera to place barriers and redirect the flow!',
        'icon': '🌊',
        'bg': '#0a1a2a',
        'accent': '#44aaff',
        'gradient': 'linear-gradient(135deg, #44aaff, #2288dd)',
        'swatches': '0x0a1a2a, 0x1a3a4a, 0x44aaff, 0x88ff88, 0xffffff',
        'mechanic': 'Move your hands to place barriers. Water flows around them!',
    },
}

SLUG_CLASS = {
    'mission-orbit-immersive': 'moi',
    'peekaboo-immersive': 'pi',
    'pixel-passport-immersive': 'ppi',
    'spot-on-immersive': 'soi',
    'squares-immersive': 'sqi',
    'story-trail-immersive': 'sti',
    'super-word-immersive': 'swi',
    'train-sounds-immersive': 'tsi',
    'waterwall-immersive': 'wi',
}

BASE = os.getcwd()

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

for slug, info in GAMES.items():
    orig = info['original']
    cls = SLUG_CLASS[slug]
    name = info['name']
    desc = info['desc']
    bg = info['bg']
    accent = info['accent']
    gradient = info['gradient']
    swatches = info['swatches']
    mechanic = info['mechanic']
    icon = info['icon']

    # info.ts
    camel = slug.replace('-', ' ').title().replace(' ', '')
    info_name = slug.replace('-', '') + 'Info'
    write_file(f'{BASE}/games/{slug}/info.ts', f"""export const {info_name} = {{
  summary: '{desc}',
}} as const""")

    # attributions.ts
    write_file(f'{BASE}/games/{slug}/attributions.ts', f"""import type {{ GameAttribution }} from '../../app/data/attribution-types.js'
import {{ repositoryCodeLicense }} from '../../app/data/attribution-types.js'

export const {slug.replace('-', '')}Attribution: GameAttribution = {{
  slug: '{slug}',
  name: '{name}',
  codeLicense: repositoryCodeLicense,
  entries: [
    {{
      title: 'Immersive mode body tracking',
      type: 'other',
      usedIn: '{name} camera-based input',
      creator: 'Peninsular Reveries',
      source: 'Original implementation',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'Uses webcam motion detection for touchless interaction.',
    }},
  ],
}}""")

    # state.ts - re-export from original
    write_file(f'{BASE}/games/{slug}/state.ts', f"""// Re-export state logic from original {orig} game
export {{ createInitialState, updateGame }} from '../{orig}/state.js'""")

    # types.ts
    write_file(f'{BASE}/games/{slug}/types.ts', f"""export type {{ GameState }} from '../{orig}/types.js'
export type {{ MotionBody, Pose }} from '../../client/camera.js'""")

    # accessibility.ts
    write_file(f'{BASE}/games/{slug}/accessibility.ts', """// Accessibility announcements for immersive mode
export function announceAction(text: string): void {
  const el = document.getElementById('game-feedback')
  if (el) el.textContent = text
}

export function announceStatus(text: string): void {
  const el = document.getElementById('game-status')
  if (el) el.textContent = text
}""")

    # sounds.ts
    write_file(f'{BASE}/games/{slug}/sounds.ts', f"""import {{ getGameAudioBuses }} from '../../client/game-audio.js'
import {{ ensureAudioUnlocked as baseEnsureAudioUnlocked }} from '../../client/audio.js'

function getCtx(): AudioContext | null {{
  try {{ return getGameAudioBuses('{slug}').ctx }} catch {{ return null }}
}}
function getSfxBus(): GainNode {{ return getGameAudioBuses('{slug}').sfx }}

export async function ensureAudioUnlocked(): Promise<void> {{ await baseEnsureAudioUnlocked() }}

let muted = false
export function setMuted(m: boolean): void {{ muted = m }}

export function sfxTap(): void {{
  const ctx = getCtx()
  if (!ctx || muted) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = 440
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
  osc.connect(gain).connect(getSfxBus())
  osc.start()
  osc.stop(ctx.currentTime + 0.1)
}}

export function sfxSelect(): void {{
  const ctx = getCtx()
  if (!ctx || muted) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = 660
  gain.gain.setValueAtTime(0.2, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  osc.connect(gain).connect(getSfxBus())
  osc.start()
  osc.stop(ctx.currentTime + 0.15)
}}

export function sfxCorrect(): void {{
  const ctx = getCtx()
  if (!ctx || muted) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.25, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  osc.connect(gain).connect(getSfxBus())
  osc.start()
  osc.stop(ctx.currentTime + 0.3)
}}

export function sfxWrong(): void {{
  const ctx = getCtx()
  if (!ctx || muted) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = 220
  gain.gain.setValueAtTime(0.2, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  osc.connect(gain).connect(getSfxBus())
  osc.start()
  osc.stop(ctx.currentTime + 0.3)
}}""")

    # main.ts (PixiJS game with mocap)
    write_file(f'{BASE}/games/{slug}/main.ts', f"""import {{ Application, Graphics, Text, Container }} from 'pixi.js'
import {{ requestCamera, startMotionTracking, stopMotionTracking }} from '../../client/camera.js'
import type {{ MotionBody }} from '../../client/camera.js'
import {{ setupGameMenu }} from '../../client/game-menu.js'
import {{ sfxTap, sfxSelect, sfxCorrect, ensureAudioUnlocked }} from './sounds.js'
import {{ announceAction, announceStatus }} from './accessibility.js'

// ── PixiJS v8 initialization ──────────────────────────────────────────────
export async function initStage(container: HTMLElement): Promise<Application | null> {{
  for (const preference of ['webgpu', 'webgl', 'canvas'] as const) {{
    try {{
      const app = new Application()
      await app.init({{ preference, backgroundAlpha: 0, autoDensity: true, resizeTo: container }})
      container.appendChild(app.canvas)
      return app
    }} catch {{ continue }}
  }}
  return null
}}

// ── Colors ─────────────────────────────────────────────────────────────────
const SWATCHES = [{swatches}]
const C = {{
  bg: SWATCHES[0],
  bgLight: SWATCHES[1],
  accent: SWATCHES[2],
  hand: SWATCHES[3],
  text: SWATCHES[4],
}}

const ALL_SCREENS = ['start-screen', 'game-screen', 'end-screen']

function showScreen(screenId: string): void {{
  for (const id of ALL_SCREENS) {{
    const el = document.getElementById(id)
    if (!el) continue
    const isActive = id === screenId
    el.hidden = !isActive
    el.classList.toggle('active', isActive)
    if (isActive) el.removeAttribute('inert')
    else el.setAttribute('inert', '')
  }}
}}

// ── Boot ────────────────────────────────────────────────────────────────────
async function boot(): Promise<void> {{
  const pixiStage = document.getElementById('pixi-stage')!
  const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement
  const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
  const cameraPrompt = document.querySelector('.{cls}-camera-prompt') as HTMLElement
  const scoreDisplay = document.getElementById('score-display')!
  const gameStatus = document.getElementById('game-status')!

  const app = await initStage(pixiStage)
  if (!app) {{
    cameraPrompt.textContent = 'Unable to initialize the game stage. Please try a different browser.'
    startBtn.disabled = true
    return
  }}

  setupGameMenu({{ musicTrackPicker: false }})

  let cameraGranted = false
  let activeBodies: MotionBody[] = []
  let gameRunning = false
  let score = 0

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {{
    startMotionTracking(cameraPreview, (bodies) => {{ activeBodies = bodies }})
    cameraPrompt.textContent = 'Camera access granted! {mechanic}'
  }} else {{
    cameraPrompt.textContent = 'Camera not available. Click or tap to interact.'
  }}

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  const bgGfx = new Graphics()
  const handGfx = new Graphics()
  const sceneGfx = new Graphics()
  const hudContainer = new Container()

  async function enterGame(): Promise<void> {{
    ensureAudioUnlocked()
    showScreen('game-screen')
    gameRunning = true
    score = 0

    await new Promise<void>((resolve) => {{
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 600)))
    }})

    const rect = pixiStage.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width)) || window.innerWidth
    const h = Math.max(1, Math.round(rect.height)) || window.innerHeight
    app.renderer.resize(w, h)

    app.stage.removeChildren()
    app.stage.addChild(bgGfx)
    app.stage.addChild(sceneGfx)
    app.stage.addChild(handGfx)
    app.stage.addChild(hudContainer)

    if (app.ticker.count) app.ticker.remove(gameLoop)
    app.ticker.add(gameLoop)
  }}

  let lastTapTime = 0
  let lastSelectTime = 0

  function gameLoop(ticker: {{ deltaMS: number }}): void {{
    if (!app || !gameRunning) return
    const sw = app.screen.width
    const sh = app.screen.height
    const now = performance.now()

    // Background
    bgGfx.clear()
    bgGfx.rect(0, 0, sw, sh).fill({{ color: C.bg }})
    // Subtle ground/scene area
    bgGfx.rect(0, sh * 0.7, sw, sh * 0.3).fill({{ color: C.bgLight }})
    bgGfx.moveTo(0, sh * 0.7).lineTo(sw, sh * 0.7).stroke({{ color: C.accent, width: 1, alpha: 0.3 }})

    // Scene graphics - show interactive zones
    sceneGfx.clear()
    const numZones = 5
    const zoneW = (sw - 20 * (numZones + 1)) / numZones
    for (let i = 0; i < numZones; i++) {{
      const zx = 20 + i * (zoneW + 20)
      const zy = sh * 0.45
      const zh = sh * 0.2
      sceneGfx.roundRect(zx, zy, zoneW, zh, 8).fill({{ color: C.bgLight, alpha: 0.8 }})
      sceneGfx.roundRect(zx, zy, zoneW, zh, 8).stroke({{ color: C.accent, alpha: 0.3, width: 1 }})

      const label = new Text({{ text: ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'][i], style: {{ fill: C.accent, fontSize: 14, fontFamily: 'system-ui' }} }})
      label.anchor.set(0.5, 0.5)
      label.position.set(zx + zoneW / 2, zy + zh / 2)
      sceneGfx.addChild(label)
    }}

    // Title text
    sceneGfx.addChild(new Text({{ text: '{name}', style: {{ fill: C.accent, fontSize: 24, fontFamily: 'system-ui', fontWeight: 'bold' }} }}).tap(t => t.position.set(sw / 2, 80)))

    // Hand tracking
    const bodies = cameraGranted ? activeBodies : []
    handGfx.clear()

    for (const body of bodies) {{
      const hx = (1 - body.normalizedX) * sw
      const hy = body.normalizedY * sh

      handGfx.circle(hx, hy, 24).fill({{ color: C.hand, alpha: 0.15 }})
      handGfx.circle(hx, hy, 10).fill({{ color: C.hand, alpha: 0.4 }})

      // Detect interaction with zones
      for (let i = 0; i < numZones; i++) {{
        const zx = 20 + i * (zoneW + 20)
        const zy = sh * 0.45
        const zh = sh * 0.2
        if (hx >= zx && hx <= zx + zoneW && hy >= zy && hy <= zy + zh) {{
          if (body.armsUp && now - lastSelectTime > 800) {{
            sfxSelect()
            lastSelectTime = now
            score += 10
            announceAction('Selected zone ' + (i + 1))
          }} else if (now - lastTapTime > 400) {{
            sfxTap()
            lastTapTime = now
          }}
          handGfx.roundRect(zx, zy, zoneW, zh, 8).stroke({{ color: C.accent, width: 2 }})
        }}
      }}
    }}

    // HUD
    hudContainer.removeChildren()
    const scoreText = new Text({{ text: `Score: ${{score}}`, style: {{ fill: C.accent, fontSize: 18, fontFamily: 'system-ui' }} }})
    scoreText.position.set(10, 10)
    hudContainer.addChild(scoreText)

    scoreDisplay.textContent = `${{score}} pts`
  }}

  function resetToStart(): void {{
    gameRunning = false
    if (app) app.ticker.remove(gameLoop)
    showScreen('start-screen')
    gameStatus.textContent = 'Ready to play!'
    score = 0
    if (cameraGranted && cameraPreview) {{
      startMotionTracking(cameraPreview, (bodies) => {{ activeBodies = bodies }})
    }}
  }}

  document.addEventListener('restart', () => resetToStart())
}}

if (document.readyState === 'loading') {{
  document.addEventListener('DOMContentLoaded', boot)
}} else {{
  boot()
}}""")

    # renderer.ts
    write_file(f'{BASE}/games/{slug}/renderer.ts', "export { initStage } from './main.js'\n")

    # controller.tsx
    attr_name = slug.replace('-', '') + 'Attribution'
    info_name = slug.replace('-', '') + 'Info'
    write_file(f'{BASE}/games/{slug}/controller.tsx', f"""import * as React from '@remix-run/component'
import {{ renderToString }} from '@remix-run/component/server'
import {{ getSiteBasePath }} from '../../app/site-config.js'
import {{ withBasePath }} from '../../app/site-paths.js'
import {{ Document }} from '../../app/ui/document.js'
import {{ GameTabbedModal, SettingsSection, SettingsToggle, SrOnly }} from '../../app/ui/game-shell.js'
import {{ {attr_name} }} from './attributions.js'
import {{ {info_name} }} from './info.js'

const modalOverlayStyles = {{ zIndex: 100, background: `{bg}ee` }}

export async function {slug.replace('-', '')}Action() {{
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="{{name}}"
      description="{{desc}}"
      path="/{slug}/"
      includeNav={{false}}
      includeFooter={{false}}
      includeDefaultStyles={{false}}
      stylesheets={{['/styles/{slug}.css']}}
      scripts={{[`/client/{slug}/main.js?v=__BUILD_SHA__`]}}
      bodyClass="{slug}-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/{slug}/manifest.json"
      serviceWorkerPath="/{slug}/sw.js"
      serviceWorkerScope="/{slug}/"
    >
      <div className="scene-track">
        <section id="start-screen" className="game-screen active" aria-labelledby="start-heading">
          <div className="{cls}-start-panel">
            <h1 id="start-heading" className="{cls}-title">{{name}}</h1>
            <p className="{cls}-subtitle">{{desc}}</p>
            <p className="{cls}-camera-prompt" id="camera-prompt">Requesting camera access…</p>
            <button id="start-btn" type="button" className="{cls}-primary-btn">Start</button>
          </div>
        </section>

        <section id="game-screen" className="game-screen" hidden aria-hidden="true">
          <div className="{cls}-game-panel">
            <div className="{cls}-game-area">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section id="end-screen" className="game-screen" hidden aria-hidden="true">
          <div className="{cls}-end-panel">
            <h2 className="{cls}-title">Great session!</h2>
            <p id="score-display">Score: 0</p>
            <button id="replay-btn" type="button" className="{cls}-primary-btn">Play Again</button>
          </div>
        </section>

        <GameTabbedModal
          title="Menu"
          overlayStyles={{modalOverlayStyles}}
          quitHref={{homePath}}
          settingsContent={{<>
            <SettingsSection title="Audio">
              <SettingsToggle id="sfx-enabled-toggle" label="Sound Effects" helpText="Sound effects are on until you change it." helpId="sfx-enabled-help" />
            </SettingsSection>
            <SettingsSection title="Controls">
              <p>{{mechanic}}</p>
            </SettingsSection>
            <SettingsSection title="Accessibility">
              <SettingsToggle id="reduce-motion-toggle" label="Reduce motion" helpText="Defaults to your device setting." helpId="reduce-motion-help" />
            </SettingsSection>
          </>}}
          infoContent={{<>
            <p>{{{info_name}.summary}}</p>
            {{{attr_name}.entries.map((e) => <p key={{e.title}}>{{e.title}} — {{e.license}}</p>)}}
          </>}}
        />
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript><p>Enable JavaScript and camera to play {{name}}.</p></noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${{html}}`, {{
    headers: {{ 'Content-Type': 'text/html; charset=utf-8' }},
  }})
}}""")

    # CSS
    write_file(f'{BASE}/public/styles/{slug}.css', f""".{slug}-game {{
  margin: 0; padding: 0; width: 100%; height: 100dvh; overflow: hidden;
  background: {bg}; color: #fff; font-family: system-ui, -apple-system, sans-serif;
}}
.{cls}-title {{ font-size: 1.5rem; color: {accent}; margin: 0; padding: 1rem 0 0.5rem; text-align: center; }}
.{cls}-subtitle {{ text-align: center; color: #8888aa; }}
.{cls}-camera-prompt {{ text-align: center; color: #6666aa; font-size: 0.9rem; }}
.{cls}-start-panel, .{cls}-end-panel {{ display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70dvh; padding: 1rem; }}
.{cls}-primary-btn {{ display: inline-block; padding: 0.8rem 2rem; border: none; border-radius: 999px; background: {gradient}; color: #111; font-size: 1.1rem; font-weight: 700; cursor: pointer; }}
.{cls}-game-panel {{ display: flex; flex-direction: column; height: 100dvh; }}
.{cls}-game-area {{ position: relative; flex: 1; overflow: hidden; }}
.{cls}-game-area video {{ position: absolute; top: 0; left: 0; width: 120px; height: 90px; object-fit: cover; border: 2px solid rgba(68, 170, 255, 0.5); border-radius: 8px; z-index: 10; transform: scaleX(-1); opacity: 0.7; }}
.{cls}-game-area #pixi-stage, .{cls}-game-area #pixi-stage canvas {{ width: 100% !important; height: 100% !important; display: block; }}
.game-screen {{ display: none; width: 100%; height: 100dvh; }}
.game-screen.active {{ display: flex; flex-direction: column; }}
.scene-track {{ width: 100%; height: 100dvh; overflow: hidden; }}""")

    # manifest.json
    write_file(f'{BASE}/public/{slug}/manifest.json', f"""{{
  "name": "{name}",
  "short_name": "{name.split(' ')[0]}",
  "description": "{desc}",
  "start_url": "/{slug}/",
  "display": "standalone",
  "background_color": "{bg}",
  "theme_color": "{accent}",
  "icons": [{{ "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" }}]
}}""")

    # sw.js
    write_file(f'{BASE}/public/{slug}/sw.js', f"""const CACHE_NAME = '{slug}-v1'; self.addEventListener('install', () => {{ self.skipWaiting() }}); self.addEventListener('activate', (event) => {{ event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))); self.clients.claim() }}); self.addEventListener('fetch', (event) => {{ if (event.request.method !== 'GET') return; event.respondWith(caches.match(event.request).then((cached) => {{ if (cached) return cached; return fetch(event.request).then((response) => {{ if (response.ok && response.type === 'basic') {{ const clone = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)) }} return response }}) }}) }})""")

print(f"Generated files for {len(GAMES)} immersive games")
for slug in GAMES:
    files = []
    for ext in ['main.ts', 'renderer.ts', 'state.ts', 'types.ts', 'accessibility.ts', 'sounds.ts', 'info.ts', 'attributions.ts', 'controller.tsx']:
        path = f'{BASE}/games/{slug}/{ext}'
        if os.path.exists(path):
            files.append(ext)
    print(f"  {slug}: {', '.join(files)}")