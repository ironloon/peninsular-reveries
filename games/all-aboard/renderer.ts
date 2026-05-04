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
  coalCar: 0x3a2a1a,
  coal: 0x222222,
  passengerCar: 0x8B0000,
  passengerWindow: 0x87CEEB,
  passengerTrim: 0xffd700,
  coupling: 0x666666,
  turboGlow: 0xff6600,
  bounceYellow: 0xffee00,
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

  // ── Turbo glow effect ──
  if (state.turboBoost > 0) {
    const turboGfx = new Graphics()
    const turboAlpha = Math.min(state.turboBoost / 200, 0.5) * (0.5 + Math.sin(state.globalTime * 15) * 0.5)
    // Glow behind the whole train
    turboGfx.circle(trainX - 50 * scale, railY - 30 * scale, 120 * scale)
    turboGfx.fill({ color: C.turboGlow, alpha: turboAlpha * 0.3 })
    turboGfx.circle(trainX - 30 * scale, railY - 35 * scale, 80 * scale)
    turboGfx.fill({ color: 0xffaa00, alpha: turboAlpha * 0.4 })
    // Speed lines
    for (let i = 0; i < 5; i++) {
      const lineY = railY - 20 * scale + (i - 2) * 25 * scale
      const lineX = trainX - 140 * scale
      turboGfx.rect(lineX - 40 * scale - Math.random() * 30, lineY, 50 * scale + Math.random() * 20, 3 * scale)
      turboGfx.fill({ color: C.turboGlow, alpha: turboAlpha * 0.6 })
    }
    container.addChild(turboGfx)
  }

  // ── Draw train cars (behind engine) ──
  for (let ci = state.trainCars.length - 1; ci >= 0; ci--) {
    const car = state.trainCars[ci]
    const carX = trainX - car.offsetX * scale
    const bob = Math.sin(car.bobPhase) * 2 * scale
    const carY = railY + bob

    if (ci === 0) {
      // ── Coal Tender ──
      const coalCar = new Graphics()
      // Coupling bar to engine
      coalCar.rect(carX + 55 * scale, carY - 5 * scale, 15 * scale, 5 * scale)
      coalCar.fill({ color: C.coupling })
      // Car body
      coalCar.roundRect(carX - 40 * scale, carY - 55 * scale, 95 * scale, 55 * scale, 4 * scale)
      coalCar.fill({ color: C.coalCar })
      // Coal pile
      coalCar.moveTo(carX - 35 * scale, carY - 55 * scale)
      coalCar.quadraticCurveTo(carX + 8 * scale, carY - 80 * scale, carX + 50 * scale, carY - 55 * scale)
      coalCar.closePath()
      coalCar.fill({ color: C.coal })
      // Gold trim
      coalCar.rect(carX - 40 * scale, carY - 57 * scale, 95 * scale, 4 * scale)
      coalCar.fill({ color: C.gold, alpha: 0.6 })
      // Wheels for coal car
      for (let w = 0; w < 2; w++) {
        const wheelX = w === 0 ? carX + 35 * scale : carX - 20 * scale
        const wheelY = carY + 4
        const wheelR = 11 * scale
        coalCar.circle(wheelX, wheelY, wheelR)
        coalCar.fill({ color: C.wheel })
        coalCar.circle(wheelX, wheelY, wheelR)
        coalCar.stroke({ color: C.wheelRim, width: 2 * scale })
        coalCar.circle(wheelX, wheelY, 3 * scale)
        coalCar.fill({ color: C.wheelHub })
      }
      container.addChild(coalCar)
    } else {
      // ── Passenger Car ──
      const passCar = new Graphics()
      // Coupling bar to coal car
      passCar.rect(carX + 55 * scale, carY - 5 * scale, 18 * scale, 5 * scale)
      passCar.fill({ color: C.coupling })
      // Car body
      passCar.roundRect(carX - 40 * scale, carY - 60 * scale, 95 * scale, 60 * scale, 4 * scale)
      passCar.fill({ color: C.passengerCar })
      // Roof
      passCar.moveTo(carX - 45 * scale, carY - 60 * scale)
      passCar.lineTo(carX + 55 * scale, carY - 60 * scale)
      passCar.lineTo(carX + 50 * scale, carY - 72 * scale)
      passCar.lineTo(carX - 40 * scale, carY - 72 * scale)
      passCar.closePath()
      passCar.fill({ color: C.roof })
      // Windows
      for (let w = 0; w < 3; w++) {
        const wx = carX - 28 * scale + w * 28 * scale
        passCar.roundRect(wx, carY - 50 * scale, 16 * scale, 18 * scale, 2 * scale)
        passCar.fill({ color: C.passengerWindow })
      }
      // Gold trim along bottom
      passCar.rect(carX - 40 * scale, carY - 2 * scale, 95 * scale, 4 * scale)
      passCar.fill({ color: C.passengerTrim, alpha: 0.6 })
      // Door
      passCar.roundRect(carX + 18 * scale, carY - 42 * scale, 14 * scale, 40 * scale, 2 * scale)
      passCar.fill({ color: 0x5a0000 })
      // Wheels for passenger car
      for (let w = 0; w < 2; w++) {
        const wheelX = w === 0 ? carX + 35 * scale : carX - 20 * scale
        const wheelY = carY + 4
        const wheelR = 11 * scale
        passCar.circle(wheelX, wheelY, wheelR)
        passCar.fill({ color: C.wheel })
        passCar.circle(wheelX, wheelY, wheelR)
        passCar.stroke({ color: C.wheelRim, width: 2 * scale })
        passCar.circle(wheelX, wheelY, 3 * scale)
        passCar.fill({ color: C.wheelHub })
      }
      container.addChild(passCar)
    }
  }

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

  // ── Coupling from cabin to coal car ──
  const coupling = new Graphics()
  coupling.rect(trainX - 115 * scale, railY - 5 * scale, 10 * scale, 5 * scale)
  coupling.fill({ color: C.coupling })
  container.addChild(coupling)

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

  // ── Turbo sparks when boosting ──
  if (state.turboBoost > 0) {
    const sparks = new Graphics()
    for (let i = 0; i < 8; i++) {
      const sparkAngle = state.globalTime * 10 + i * (Math.PI * 2 / 8)
      const sparkR = (30 + Math.sin(state.globalTime * 8 + i) * 15) * scale
      const sx = trainX - 40 * scale + Math.cos(sparkAngle) * sparkR
      const sy = railY - 40 * scale + Math.sin(sparkAngle) * sparkR
      sparks.circle(sx, sy, 3 * scale)
      sparks.fill({ color: i % 2 === 0 ? C.turboGlow : C.bounceYellow, alpha: 0.7 })
    }
    container.addChild(sparks)
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
  } else if (pose === 'bouncing') {
    // Bouncing/stomp icon - vertical arrows with fire
    const bounceY = Math.sin(time * 10) * 8
    // Up arrow
    g.moveTo(x, y - 20 + bounceY)
    g.lineTo(x - 10, y - 8 + bounceY)
    g.lineTo(x + 10, y - 8 + bounceY)
    g.closePath()
    g.fill({ color: C.bounceYellow, alpha: 0.8 })
    // Down arrow
    g.moveTo(x, y + 20 - bounceY)
    g.lineTo(x - 10, y + 8 - bounceY)
    g.lineTo(x + 10, y + 8 - bounceY)
    g.closePath()
    g.fill({ color: C.turboGlow, alpha: 0.8 })
    // Pulsing ring
    const pulse = Math.sin(time * 12) * 6 + 22
    g.circle(x, y, pulse)
    g.stroke({ color: C.turboGlow, width: 3, alpha: 0.5 + Math.sin(time * 8) * 0.3 })
    // Spark particles
    for (let i = 0; i < 4; i++) {
      const sparkAngle = time * 8 + i * (Math.PI / 2)
      const sparkR = 18 + Math.sin(time * 10 + i) * 5
      g.circle(x + Math.cos(sparkAngle) * sparkR, y + Math.sin(sparkAngle) * sparkR, 3)
      g.fill({ color: i % 2 === 0 ? C.bounceYellow : C.turboGlow, alpha: 0.7 })
    }
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

  if (state.turboBoost > 0) {
    const turboText = new Text({
      text: '⚡ TURBO!',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 22,
        fill: 0xff6600,
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 3 },
      },
    })
    turboText.anchor.set(0.5, 0)
    turboText.x = screenWidth / 2
    turboText.y = state.chuggingActive ? 42 : 15
    container.addChild(turboText)
  }
}