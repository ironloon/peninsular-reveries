import { Application, Container, Graphics, Text } from 'pixi.js'
import type { GameState } from './types.js'

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
  message.textContent = 'Unable to start the train stage. Your browser cannot run this experience.'
  canvasContainer.appendChild(message)
  return null
}

// ── Colors ──────────────────────────────────────────────────────────────────
const C = {
  sky: 0x87CEEB,
  skyBottom: 0xE0F0FF,
  ground: 0x8B7355,
  groundDark: 0x6B5335,
  rail: 0x444444,
  railTie: 0x8B6914,
  engine: 0x1a1a2e,
  engineFront: 0x16213e,
  cowcatcher: 0x555555,
  cabin: 0x0f3460,
  cabinWindow: 0xffd700,
  roof: 0x2d2d2d,
  steam: 0xffffff,
  wheel: 0x333333,
  wheelRim: 0x666666,
  wheelHub: 0x999999,
  whistleCloud: 0xffffff,
  smoke: 0x555555,
  gold: 0xffd700,
  red: 0xe63946,
  text: 0xffffff,
}

const GROUND_Y_RATIO = 0.78
const RAIL_Y_RATIO = 0.80

export function drawBackground(g: Graphics, width: number, height: number, time: number): void {
  g.clear()

  const groundY = height * GROUND_Y_RATIO
  const railY = height * RAIL_Y_RATIO

  // Sky gradient (two bands)
  g.rect(0, 0, width, groundY)
  g.fill({ color: C.sky })

  // Clouds
  const cloudOffset = (time * 8) % (width + 300)
  g.circle(cloudOffset - 100, height * 0.12, 30)
  g.circle(cloudOffset - 70, height * 0.10, 40)
  g.circle(cloudOffset - 30, height * 0.12, 35)
  g.circle(cloudOffset - 55, height * 0.14, 28)
  g.fill({ color: 0xffffff, alpha: 0.7 })

  const cloudOffset2 = (time * 5 + 400) % (width + 300)
  g.circle(cloudOffset2 - 80, height * 0.22, 25)
  g.circle(cloudOffset2 - 50, height * 0.20, 35)
  g.circle(cloudOffset2 - 20, height * 0.22, 28)
  g.fill({ color: 0xffffff, alpha: 0.5 })

  // Ground
  g.rect(0, groundY, width, height - groundY)
  g.fill({ color: C.ground })

  // Grass tufts
  g.rect(0, groundY, width, 6)
  g.fill({ color: 0x6B8E23, alpha: 0.4 })

  // Railroad ties
  const tieSpacing = 40
  const tieOffset = (time * 50) % tieSpacing // scroll with perspective
  for (let x = -tieOffset; x < width + tieSpacing; x += tieSpacing) {
    g.rect(x - 5, railY - 3, 10, 8)
    g.fill({ color: C.railTie })
  }

  // Rails
  g.rect(0, railY - 2, width, 4)
  g.fill({ color: C.rail })
  g.rect(0, railY + 18, width, 4)
  g.fill({ color: C.rail })
}

export function drawTrain(
  container: Container,
  state: GameState,
  screenWidth: number,
  screenHeight: number,
): void {
  container.removeChildren()

  const railY = screenHeight * RAIL_Y_RATIO
  const trainX = state.trainX
  const scale = Math.min(screenHeight / 600, 1)

  // ── Cowcatcher ──
  const cowcatcher = new Graphics()
  cowcatcher.moveTo(trainX + 45 * scale, railY - 55 * scale)
  cowcatcher.lineTo(trainX + 70 * scale, railY + 5)
  cowcatcher.lineTo(trainX + 45 * scale, railY + 5)
  cowcatcher.closePath()
  cowcatcher.fill({ color: C.cowcatcher })
  container.addChild(cowcatcher)

  // ── Engine body ──
  const engine = new Graphics()
  // Main boiler
  engine.roundRect(trainX - 60 * scale, railY - 80 * scale, 110 * scale, 60 * scale, 0)
  engine.fill({ color: C.engine })
  // Front face
  engine.roundRect(trainX + 45 * scale, railY - 75 * scale, 25 * scale, 50 * scale, 0)
  engine.fill({ color: C.engineFront })
  // Boiler bands
  engine.rect(trainX - 30 * scale, railY - 80 * scale, 4 * scale, 60 * scale)
  engine.fill({ color: C.gold })
  engine.rect(trainX + 5 * scale, railY - 80 * scale, 4 * scale, 60 * scale)
  engine.fill({ color: C.gold })
  container.addChild(engine)

  // ── Smokestack ──
  const smokestack = new Graphics()
  smokestack.rect(trainX - 40 * scale, railY - 110 * scale, 20 * scale, 32 * scale)
  smokestack.fill({ color: C.engine })
  smokestack.rect(trainX - 45 * scale, railY - 115 * scale, 30 * scale, 10 * scale)
  smokestack.fill({ color: C.roof })
  // Smokestack top rim
  smokestack.ellipse(trainX - 30 * scale, railY - 115 * scale, 16 * scale, 5 * scale)
  smokestack.fill({ color: 0x333333 })
  container.addChild(smokestack)

  // ── Cabin ──
  const cabin = new Graphics()
  cabin.rect(trainX - 100 * scale, railY - 95 * scale, 50 * scale, 80 * scale)
  cabin.fill({ color: C.cabin })
  // Cabin roof
  cabin.moveTo(trainX - 110 * scale, railY - 95 * scale)
  cabin.lineTo(trainX - 40 * scale, railY - 95 * scale)
  cabin.lineTo(trainX - 45 * scale, railY - 115 * scale)
  cabin.lineTo(trainX - 105 * scale, railY - 115 * scale)
  cabin.closePath()
  cabin.fill({ color: C.roof })
  // Window
  cabin.rect(trainX - 90 * scale, railY - 82 * scale, 22 * scale, 20 * scale)
  cabin.fill({ color: C.cabinWindow })
  // Door
  cabin.rect(trainX - 60 * scale, railY - 65 * scale, 12 * scale, 50 * scale)
  cabin.fill({ color: 0x1a3a6a })
  container.addChild(cabin)

  // ── Wheels ──
  for (let i = 0; i < state.wheels.length; i++) {
    const w = state.wheels[i]
    const wheelX = i === 0 ? trainX + 15 * scale : trainX - 75 * scale
    const wheelY = railY + 4
    const wheelR = 14 * scale
    const wheelGfx = new Graphics()

    // Rim
    wheelGfx.circle(wheelX, wheelY, wheelR)
    wheelGfx.fill({ color: C.wheel })
    wheelGfx.circle(wheelX, wheelY, wheelR)
    wheelGfx.stroke({ color: C.wheelRim, width: 3 * scale })

    // Hub
    wheelGfx.circle(wheelX, wheelY, 4 * scale)
    wheelGfx.fill({ color: C.wheelHub })

    // Spokes (rotate with wheel angle)
    for (let s = 0; s < 6; s++) {
      const spokeAngle = w.angle + (s * Math.PI) / 3
      wheelGfx.moveTo(wheelX, wheelY)
      wheelGfx.lineTo(
        wheelX + Math.cos(spokeAngle) * (wheelR - 2),
        wheelY + Math.sin(spokeAngle) * (wheelR - 2),
      )
    }
    wheelGfx.stroke({ color: C.wheelHub, width: 1.5 * scale })

    container.addChild(wheelGfx)
  }

  // ── Headlamp ──
  const lamp = new Graphics()
  lamp.circle(trainX + 65 * scale, railY - 55 * scale, 6 * scale)
  lamp.fill({ color: C.gold })
  // Glow
  lamp.circle(trainX + 65 * scale, railY - 55 * scale, 12 * scale)
  lamp.fill({ color: 0xffffaa, alpha: 0.15 })
  container.addChild(lamp)

  // ── Steam puffs ──
  for (const puff of state.steamPuffs) {
    const puffGfx = new Graphics()
    const alpha = Math.max(0, puff.life / puff.maxLife) * 0.6
    puffGfx.circle(puff.x, railY + puff.y, puff.size * scale)
    puffGfx.fill({ color: C.steam, alpha })
    container.addChild(puffGfx)
  }

  // ── Whistle cloud (shown when whistle triggered) ──
  if (state.whistleTriggered || state.whistleCooldown > 2.5) {
    const cloudX = trainX - 30 * scale
    const cloudY = railY - 140 * scale
    const whistleCloud = new Graphics()
    const wcAlpha = state.whistleCooldown > 2.5 ? Math.min(1, (state.whistleCooldown - 2.5) * 2) : Math.max(0, state.whistleCooldown * 0.5)
    whistleCloud.circle(cloudX, cloudY, 18 * scale)
    whistleCloud.fill({ color: C.whistleCloud, alpha: wcAlpha * 0.8 })
    whistleCloud.circle(cloudX - 15 * scale, cloudY + 5, 14 * scale)
    whistleCloud.fill({ color: C.whistleCloud, alpha: wcAlpha * 0.6 })
    whistleCloud.circle(cloudX + 12 * scale, cloudY + 3, 16 * scale)
    whistleCloud.fill({ color: C.whistleCloud, alpha: wcAlpha * 0.7 })
    container.addChild(whistleCloud)
  }
}

export function drawPoseIndicator(
  g: Graphics,
  pose: string,
  x: number,
  y: number,
  time: number,
): void {
  g.clear()

  if (pose === 'idle') {
    // Small dot
    g.circle(x, y, 6)
    g.fill({ color: 0xffffff, alpha: 0.3 })
  } else if (pose === 'hand-up') {
    // Hand up icon - raised hand
    g.circle(x, y - 20, 12)
    g.fill({ color: C.gold, alpha: 0.6 })
    g.rect(x - 3, y - 8, 6, 18)
    g.fill({ color: C.gold, alpha: 0.6 })
    // Pulsing ring
    const pulse = Math.sin(time * 8) * 5 + 15
    g.circle(x, y - 15, pulse)
    g.stroke({ color: C.gold, width: 2, alpha: 0.5 })
  } else if (pose === 'arm-rotating') {
    // Arm rotation icon - circle arrow
    const angle = time * 6
    const r = 18
    g.circle(x, y, r + 4)
    g.fill({ color: C.red, alpha: 0.15 })
    // Arc
    g.arc(x, y, r, angle, angle + Math.PI * 1.3)
    g.stroke({ color: C.red, width: 4, alpha: 0.8 })
    // Arrowhead
    const endAngle = angle + Math.PI * 1.3
    const ax = x + Math.cos(endAngle) * r
    const ay = y + Math.sin(endAngle) * r
    g.circle(ax, ay, 5)
    g.fill({ color: C.red, alpha: 0.8 })
    // "CHUGGA" text effect
    const textAlpha = 0.5 + Math.sin(time * 12) * 0.5
    g.circle(x, y, r + 8 + Math.sin(time * 10) * 4)
    g.stroke({ color: C.red, width: 2, alpha: textAlpha * 0.3 })
  } else if (pose === 'both-arms-up') {
    // Both arms celebration
    g.circle(x, y, 16)
    g.fill({ color: C.gold, alpha: 0.4 })
    g.circle(x, y, 22 + Math.sin(time * 6) * 5)
    g.stroke({ color: C.gold, width: 3, alpha: 0.5 })
  }
}

export function drawHUD(
  container: Container,
  state: GameState,
  screenWidth: number,
): void {
  container.removeChildren()

  const scoreText = new Text({
    text: `${state.score} pts`,
    style: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 28,
      fill: 0xffffff,
      fontWeight: 'bold',
      stroke: { color: 0x000000, width: 4 },
    },
  })
  scoreText.anchor.set(1, 0)
  scoreText.x = screenWidth - 20
  scoreText.y = 20
  container.addChild(scoreText)

  const tripText = new Text({
    text: `Trips: ${state.trips}`,
    style: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 20,
      fill: 0xffffff,
      fontWeight: 'bold',
      stroke: { color: 0x000000, width: 3 },
    },
  })
  tripText.anchor.set(1, 0)
  tripText.x = screenWidth - 20
  tripText.y = 55
  container.addChild(tripText)

  if (state.chuggingActive) {
    const chugText = new Text({
      text: '🚂 CHUGGA CHUGGA',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fill: 0xffd700,
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 3 },
      },
    })
    chugText.anchor.set(0.5, 0)
    chugText.x = screenWidth / 2
    chugText.y = 15
    container.addChild(chugText)
  }
}