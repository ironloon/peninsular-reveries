import { Application, Container, Graphics } from 'pixi.js'
import { buildSprite, getPlantModel } from './sprites.js'
import type { PlantState, DayNightState, WeatherState, RainDrop, SparkleParticle } from './types.js'

const LANE_COLORS = [0xFF7043, 0x42A5F5, 0xFFEE58, 0xB0BEC5, 0xAB47BC] // orange, blue, yellow, grey(wind), purple


async function checkRendererHealth(app: Application): Promise<boolean> {
  const g = new Graphics()
  g.rect(0, 0, 50, 50)
  g.fill({ color: 0xff0000 })
  app.stage.addChild(g)
  app.render()

  const temp = document.createElement('canvas')
  temp.width = 50
  temp.height = 50
  const ctx = temp.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    app.stage.removeChild(g)
    g.destroy()
    return false
  }

  try {
    ctx.drawImage(app.canvas, 0, 0, 50, 50, 0, 0, 50, 50)
    const data = ctx.getImageData(0, 0, 50, 50).data
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 200 && data[i + 1] < 50 && data[i + 2] < 50) {
        app.stage.removeChild(g)
        g.destroy()
        app.render()
        return true
      }
    }
  } catch {
    // broken renderer
  }

  app.stage.removeChild(g)
  g.destroy()
  app.render()
  return false
}

async function tryCreateApp(container: HTMLElement, preference: 'webgpu' | 'webgl' | 'canvas'): Promise<Application | null> {
  const app = new Application()
  try {
    await app.init({
      preference,
      backgroundAlpha: 0,
      autoDensity: true,
    })
    container.appendChild(app.canvas)
    return app
  } catch {
    return null
  }
}

export async function initStage(canvasContainer: HTMLElement): Promise<Application | null> {
  for (const preference of ['webgpu', 'webgl', 'canvas'] as const) {
    const app = await tryCreateApp(canvasContainer, preference)
    if (!app) continue

    const healthy = await checkRendererHealth(app)
    if (healthy) return app

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(app as any).destroy(true)
    canvasContainer.innerHTML = ''
  }

  const message = document.createElement('p')
  message.style.color = '#e0e0e0'
  message.style.textAlign = 'center'
  message.style.padding = '2rem'
  message.textContent = 'Unable to start the garden. Your browser cannot run this experience.'
  canvasContainer.appendChild(message)
  return null
}

// ── Plant container management ─────────────────────────────────────────────

const plantContainers = new Map<number, Container>()

interface PlantGfx {
  container: Container
  parts: Map<string, Graphics>
  nativeBounds: { x: number; y: number; width: number; height: number }
  currentStage: string
}

const plantGfxMap = new WeakMap<Container, PlantGfx>()

export function createPlantGraphics(plant: PlantState): Container {
  const model = getPlantModel(plant.stage, plant.colorSeed)
  const { container, parts, nativeBounds } = buildSprite(model)
  const gfx: PlantGfx = { container, parts, nativeBounds, currentStage: plant.stage }
  plantGfxMap.set(container, gfx)
  return container
}

export function updatePlantStage(plant: PlantState): Container | null {
  const existing = plantContainers.get(plant.id)
  if (existing) {
    const gfx = plantGfxMap.get(existing)
    if (gfx && gfx.currentStage !== plant.stage) {
      // Rebuild the plant sprite for new stage
      const model = getPlantModel(plant.stage, plant.colorSeed)
      const { container: newContainer, parts: newParts, nativeBounds: newBounds } = buildSprite(model)

      // Copy over from old, then rebuild
      gfx.container.removeChildren()
      for (const part of newContainer.children) {
        gfx.container.addChild(part)
      }
      gfx.parts.clear()
      for (const [name, part] of newParts) {
        gfx.parts.set(name, part)
      }
      gfx.nativeBounds = newBounds
      gfx.currentStage = plant.stage
    }
    return existing
  }
  return null
}

// ── Sky / background rendering ─────────────────────────────────────────────

export function createSkyGraphics(stageWidth: number, stageHeight: number, dayNight: DayNightState, weather: WeatherState): Graphics {
  const g = new Graphics()
  drawSky(g, stageWidth, stageHeight, dayNight, weather)
  return g
}

export function updateSkyGraphics(g: Graphics, stageWidth: number, stageHeight: number, dayNight: DayNightState, weather: WeatherState): void {
  g.clear()
  drawSky(g, stageWidth, stageHeight, dayNight, weather)
}

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff
  const rr = Math.round(ar + (br - ar) * t)
  const rg = Math.round(ag + (bg - ag) * t)
  const rb = Math.round(ab + (bb - ab) * t)
  return (rr << 16) | (rg << 8) | rb
}

function drawSky(g: Graphics, w: number, h: number, dayNight: DayNightState, weather: WeatherState): void {
  const brightness = dayNight.skyBrightness

  // Sky gradient colors based on time of day
  const topDay = 0x4FC3F7
  const topNight = 0x0D1B2A
  const bottomDay = 0x81D4FA
  const bottomNight = 0x1A237E

  const daySunsetBottom = 0xFFB74D

  let topColor: number, bottomColor: number

  if (dayNight.timeOfDay === 'night') {
    topColor = topNight
    bottomColor = bottomNight
  } else if (dayNight.timeOfDay === 'dawn') {
    topColor = lerpColor(topNight, topDay, brightness)
    bottomColor = lerpColor(bottomNight, daySunsetBottom, brightness)
  } else if (dayNight.timeOfDay === 'dusk') {
    topColor = lerpColor(topDay, topNight, 1 - brightness)
    bottomColor = lerpColor(bottomDay, daySunsetBottom, 1 - brightness)
  } else {
    topColor = topDay
    bottomColor = bottomDay
  }

  // Cloud overlay dims things
  if (weather.type === 'cloudy' || weather.type === 'rainy') {
    const dimFactor = weather.type === 'rainy' ? 0.5 : 0.3
    topColor = lerpColor(topColor, 0x78909C, dimFactor)
    bottomColor = lerpColor(bottomColor, 0x90A4AE, dimFactor)
  }

  // Draw sky gradient (3 bands)
  const skyTop = topColor
  const skyMid = lerpColor(topColor, bottomColor, 0.5)
  const skyBot = bottomColor

  g.rect(0, 0, w, h / 2)
  g.fill({ color: skyTop })
  g.rect(0, h * 0.25, w, h / 4)
  g.fill({ color: skyMid })
  g.rect(0, h * 0.5, w, h / 2)
  g.fill({ color: skyBot })

  // Sun or moon
  if (dayNight.timeOfDay === 'day' || dayNight.timeOfDay === 'dawn') {
    // Sun
    const sunX = w * 0.8
    const sunY = h * 0.15 + (1 - brightness) * 40
    const sunRadius = 20 + brightness * 10
    g.circle(sunX, sunY, sunRadius)
    g.fill({ color: 0xFFEE58, alpha: brightness })
    // Sun glow
    g.circle(sunX, sunY, sunRadius * 1.5)
    g.fill({ color: 0xFFEE58, alpha: brightness * 0.15 })
  } else if (dayNight.timeOfDay === 'night') {
    // Moon
    const moonX = w * 0.75
    const moonY = h * 0.12
    g.circle(moonX, moonY, 16)
    g.fill({ color: 0xE0E0E0, alpha: 0.9 })
    g.circle(moonX + 5, moonY - 3, 13)
    g.fill({ color: topNight, alpha: 1 })

    // Stars
    const starSeed = 42
    for (let i = 0; i < 25; i++) {
      const sx = ((starSeed * (i + 1) * 7) % w)
      const sy = ((starSeed * (i + 1) * 13) % (h * 0.55))
      const sr = 0.8 + (i % 3) * 0.4
      g.circle(sx, sy, sr)
      g.fill({ color: 0xFFFFFF, alpha: 0.4 + (i % 4) * 0.1 })
    }
  }

  // Clouds for cloudy/rainy
  if (weather.type === 'cloudy' || weather.type === 'rainy') {
    const cloudAlpha = weather.type === 'rainy' ? 0.6 : 0.35
    const cloudColor = weather.type === 'rainy' ? 0x607D8B : 0xB0BEC5
    drawCloud(g, w * 0.2, h * 0.08, 60, cloudColor, cloudAlpha)
    drawCloud(g, w * 0.5, h * 0.12, 80, cloudColor, cloudAlpha)
    drawCloud(g, w * 0.8, h * 0.06, 50, cloudColor, cloudAlpha)
    drawCloud(g, w * 0.35, h * 0.18, 70, cloudColor, cloudAlpha)
  }
}

function drawCloud(g: Graphics, x: number, y: number, size: number, color: number, alpha: number): void {
  g.circle(x, y, size * 0.5)
  g.fill({ color, alpha })
  g.circle(x - size * 0.35, y + size * 0.1, size * 0.38)
  g.fill({ color, alpha })
  g.circle(x + size * 0.35, y + size * 0.05, size * 0.42)
  g.fill({ color, alpha })
  g.circle(x + size * 0.15, y - size * 0.15, size * 0.35)
  g.fill({ color, alpha })
}

// ── Ground / soil rendering ─────────────────────────────────────────────────

export function createGroundGraphics(stageWidth: number, stageHeight: number, soilMoisture: number[]): Graphics {
  const g = new Graphics()
  drawGround(g, stageWidth, stageHeight, soilMoisture)
  return g
}

export function updateGroundGraphics(g: Graphics, stageWidth: number, stageHeight: number, soilMoisture: number[]): void {
  g.clear()
  drawGround(g, stageWidth, stageHeight, soilMoisture)
}

function drawGround(g: Graphics, w: number, h: number, soilMoisture: number[]): void {
  const groundY = h * 0.72
  const laneWidth = w / 5

  // Main ground
  g.rect(0, groundY, w, h - groundY)
  g.fill({ color: 0x5D4037 })

  // Per-lane moisture visualization
  for (let i = 0; i < 5; i++) {
    const moisture = soilMoisture[i] ?? 0.3
    const alpha = 0.1 + moisture * 0.35
    g.rect(i * laneWidth, groundY, laneWidth, h - groundY)
    g.fill({ color: 0x1565C0, alpha })

    // Lane separator (subtle)
    if (i > 0) {
      g.rect(i * laneWidth - 1, groundY, 2, h - groundY)
      g.fill({ color: 0x4E342E, alpha: 0.5 })
    }
  }

  // Top soil line with grass dots
  g.moveTo(0, groundY)
  for (let x = 0; x < w; x += 6) {
    const grassH = 2 + Math.sin(x * 0.3) * 1.5
    g.rect(x, groundY - grassH, 2, grassH)
    g.fill({ color: 0x388E3C, alpha: 0.6 })
  }

  // Lane labels at top of ground
  for (let i = 0; i < 5; i++) {
    const cx = i * laneWidth + laneWidth / 2
    // Small colored dot indicator
    g.circle(cx, groundY + 12, 6)
    g.fill({ color: LANE_COLORS[i], alpha: 0.4 })
  }
}

// ── Rain rendering ──────────────────────────────────────────────────────────

export function createRainGraphics(): Graphics {
  const g = new Graphics()
  return g
}

export function updateRainGraphics(g: Graphics, rainDrops: RainDrop[]): void {
  g.clear()
  for (const drop of rainDrops) {
    g.moveTo(drop.x, drop.y)
    g.lineTo(drop.x - 1, drop.y + drop.length)
    g.stroke({ color: 0x90CAF9, alpha: drop.opacity, width: 1.5 })
  }
}

// ── Sparkle rendering ────────────────────────────────────────────────────────

export function updateSparkleGraphics(g: Graphics, sparkles: SparkleParticle[]): void {
  g.clear()
  for (const s of sparkles) {
    const alpha = Math.max(0, s.life / s.maxLife)
    const pulseSize = s.size * (1 + Math.sin(s.life * 0.01) * 0.3)
    g.circle(s.x, s.y, pulseSize)
    g.fill({ color: s.color, alpha })
  }
}

// ── Lane activity indicators ─────────────────────────────────────────────────

export function updateLaneIndicators(g: Graphics, lanes: { activity: number }[], stageWidth: number, stageHeight: number): void {
  g.clear()
  const groundY = stageHeight * 0.72
  const laneWidth = stageWidth / 5

  for (let i = 0; i < lanes.length; i++) {
    const act = lanes[i].activity
    if (act > 0.05) {
      const cx = i * laneWidth + laneWidth / 2
      const barHeight = act * 40
      g.rect(cx - 10, groundY - barHeight - 20, 20, barHeight)
      g.fill({ color: LANE_COLORS[i], alpha: act * 0.6 })
    }
  }
}

// ── HUD overlay ─────────────────────────────────────────────────────────────

export function createHUDGraphics(): Graphics {
  return new Graphics()
}

export function updateHUDGraphics(
  g: Graphics,
  stageWidth: number,
  stageHeight: number,
  moistureLevel: number,
  dayNight: DayNightState,
  weather: WeatherState,
  _totalBloomed: number,
): void {
  g.clear()

  // Moisture bar
  const barX = 10
  const barY = 10
  const barW = 60
  const barH = 8

  g.roundRect(barX, barY, barW, barH, 4)
  g.fill({ color: 0x333333, alpha: 0.5 })
  g.roundRect(barX + 1, barY + 1, (barW - 2) * moistureLevel, barH - 2, 3)
  g.fill({ color: 0x42A5F5, alpha: 0.7 })

  // Time of day indicator
  // We can't render emoji in Graphics easily, so we use a small icon:
  const timeColors: Record<string, number> = { dawn: 0xFFAB40, day: 0xFFEE58, dusk: 0xFF6E40, night: 0x5C6BC0 }
  const timeColor = timeColors[dayNight.timeOfDay] ?? 0xFFFFFF
  g.circle(barX + barW + 16, barY + barH / 2, 6)
  g.fill({ color: timeColor, alpha: 0.8 })

  // Weather indicator
  const weatherColors: Record<string, number> = { sunny: 0xFFEE58, cloudy: 0xB0BEC5, rainy: 0x42A5F5 }
  const wc = weatherColors[weather.type] ?? 0xFFEE58
  g.circle(barX + barW + 32, barY + barH / 2, 5)
  g.fill({ color: wc, alpha: 0.6 })
}