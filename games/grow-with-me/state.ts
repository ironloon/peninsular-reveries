import type { GameState, MotionZone, PlantState, PlantStage, DayNightState, WeatherState, LaneState, WeatherType, TimeOfDay, SparkleParticle } from './types.js'

const NUM_LANES = 5
const DAY_CYCLE_MS = 12000 // 12 seconds per full day/night cycle
const BASE_GROWTH_RATE = 0.0003 // base growth per ms during daytime
const RAIN_GROWTH_BOOST = 2.5 // multiplier when rain boost is active
const MOISTURE_GROWTH_BOOST = 1.8 // multiplier for moisture-boosted growth
const MOISTURE_FROM_WATER_LANE = 0.004 // per ms of water lane activity
const MOISTURE_DECAY = 0.0003 // natural moisture decay per ms
const RAIN_BOOST_DURATION = 6000 // ms rain boost lasts after rain stops
const RAIN_BOOST_DECAY = 0.0005 // rate at which rainBoostTimer decreases
const PLANT_ACTIVITY_THRESHOLD = 0.15 // minimum activity to trigger lane action
const WEATHER_MIN_DURATION = 6000
const WEATHER_MAX_DURATION = 14000
const WEATHER_CHANGE_MIN = 4000
const WEATHER_CHANGE_MAX = 10000
const MAX_PLANTS_PER_LANE = 3

const PLANT_HEIGHTS: Record<PlantStage, number> = {
  seed: 4,
  sprout: 12,
  growing: 30,
  bud: 48,
  bloom: 60,
  fruiting: 55,
}

const STAGE_DURATIONS: Record<PlantStage, number> = {
  seed: 1, // progress 0-1 to advance from seed
  sprout: 1,
  growing: 1,
  bud: 1,
  bloom: 1,
  fruiting: 1,
}

export function createInitialState(): GameState {
  return {
    phase: 'start',
    plants: [],
    rainDrops: [],
    leafParticles: [],
    sparkleParticles: [],
    dayNight: {
      timeMs: 3000, // start at dawn
      cycleLengthMs: DAY_CYCLE_MS,
      timeOfDay: 'dawn',
      skyBrightness: 0.5,
    },
    weather: {
      type: 'sunny',
      timerMs: 0,
      durationMs: WEATHER_MAX_DURATION,
      rainIntensity: 0,
      nextWeatherIn: 8000,
    },
    lanes: Array.from({ length: NUM_LANES }, () => ({
      activity: 0,
      lastActiveMs: 0,
    })),
    moistureLevel: 0.3,
    rainBoostDecay: 0,
    totalBloomed: 0,
    time: 0,
    nextPlantId: 1,
    harvestFlash: 0,
    soilMoistureMap: Array(NUM_LANES).fill(0.3),
  }
}

export function startGame(_state: GameState): GameState {
  return {
    ...createInitialState(),
    phase: 'playing',
    dayNight: {
      ...createInitialState().dayNight,
      timeMs: 3000,
    },
  }
}

export function updateGame(
  state: GameState,
  zones: MotionZone[],
  stageWidth: number,
  stageHeight: number,
  deltaMs: number,
): GameState {
  if (state.phase !== 'playing') return state

  const dt = Math.min(deltaMs, 50)
  const time = state.time + dt
  const laneWidth = stageWidth / NUM_LANES
  const groundY = stageHeight * 0.72

  // ── Update lane activity from motion zones ────────────────────────────
  const lanes: LaneState[] = state.lanes.map((lane) => ({
    ...lane,
    activity: lane.activity * 0.92, // decay
  }))

  for (const zone of zones) {
    if (!zone.active) continue
    const laneIndex = Math.floor(zone.normalizedX * NUM_LANES)
    if (laneIndex >= 0 && laneIndex < NUM_LANES) {
      const activity = Math.min(1, lanes[laneIndex].activity + zone.spreadY * 2.5 + 0.15)
      lanes[laneIndex] = {
        activity: Math.max(lanes[laneIndex].activity, activity),
        lastActiveMs: time,
      }
    }
  }

  // ── Update day/night cycle ────────────────────────────────────────────
  const dayNight: DayNightState = {
    ...state.dayNight,
    timeMs: (state.dayNight.timeMs + dt) % state.dayNight.cycleLengthMs,
  }

  // Speed up day cycle when sun lane (lane 2) is active
  const sunLaneActivity = lanes[2].activity
  if (sunLaneActivity > PLANT_ACTIVITY_THRESHOLD) {
    const speedBoost = 1 + sunLaneActivity * 3
    dayNight.timeMs = (state.dayNight.timeMs + dt * speedBoost) % state.dayNight.cycleLengthMs
  }

  const cycleProgress = dayNight.timeMs / dayNight.cycleLengthMs
  // 0-0.25: dawn, 0.25-0.5: day, 0.5-0.75: dusk, 0.75-1.0: night
  let timeOfDay: TimeOfDay
  let skyBrightness: number

  if (cycleProgress < 0.15) {
    timeOfDay = 'dawn'
    skyBrightness = 0.3 + (cycleProgress / 0.15) * 0.7
  } else if (cycleProgress < 0.45) {
    timeOfDay = 'day'
    skyBrightness = 1.0
  } else if (cycleProgress < 0.6) {
    timeOfDay = 'dusk'
    skyBrightness = 0.7 - ((cycleProgress - 0.45) / 0.15) * 0.4
  } else {
    timeOfDay = 'night'
    skyBrightness = 0.15 + Math.sin((cycleProgress - 0.6) / 0.4 * Math.PI) * 0.03
  }

  dayNight.timeOfDay = timeOfDay
  dayNight.skyBrightness = skyBrightness

  // ── Update weather ───────────────────────────────────────────────────
  let weather: WeatherState = { ...state.weather }
  let moistureLevel = state.moistureLevel
  let rainBoostTimer = state.rainBoostDecay

  weather.timerMs += dt

  // Wind lane (lane 3) triggers rain
  const windLaneActivity = lanes[3].activity
  if (windLaneActivity > PLANT_ACTIVITY_THRESHOLD && weather.type === 'sunny') {
    weather.nextWeatherIn -= dt * (1 + windLaneActivity * 3)
  }

  // Water lane (lane 1) adds moisture directly
  const waterLaneActivity = lanes[1].activity
  if (waterLaneActivity > PLANT_ACTIVITY_THRESHOLD) {
    moistureLevel = Math.min(1, moistureLevel + MOISTURE_FROM_WATER_LANE * dt * waterLaneActivity)
  }

  // Natural moisture decay
  moistureLevel = Math.max(0, moistureLevel - MOISTURE_DECAY * dt)

  // Weather transitions
  if (weather.type === 'rainy') {
    rainBoostTimer = RAIN_BOOST_DURATION
    if (weather.timerMs >= weather.durationMs) {
      // Rain ends
      const nextType: WeatherType = Math.random() < 0.7 ? 'cloudy' : 'sunny'
      weather = {
        type: nextType,
        timerMs: 0,
        durationMs: WEATHER_MIN_DURATION + Math.random() * (WEATHER_MAX_DURATION - WEATHER_MIN_DURATION),
        rainIntensity: 0,
        nextWeatherIn: WEATHER_CHANGE_MIN + Math.random() * WEATHER_CHANGE_MAX,
      }
    }
  } else if (weather.timerMs >= weather.nextWeatherIn) {
    let nextType: WeatherType
    if (weather.type === 'sunny') {
      nextType = Math.random() < 0.6 ? 'cloudy' : 'rainy'
    } else {
      // cloudy
      nextType = Math.random() < 0.5 ? 'rainy' : 'sunny'
    }
    weather = {
      type: nextType,
      timerMs: 0,
      durationMs: WEATHER_MIN_DURATION + Math.random() * (WEATHER_MAX_DURATION - WEATHER_MIN_DURATION),
      rainIntensity: nextType === 'rainy' ? 0.3 + Math.random() * 0.7 : 0,
      nextWeatherIn: WEATHER_CHANGE_MIN + Math.random() * WEATHER_CHANGE_MAX,
    }
  }

  // Rain boost decay (persists after rain)
  rainBoostTimer = Math.max(0, rainBoostTimer - RAIN_BOOST_DECAY * dt)

  // Per-lane soil moisture
  const soilMoistureMap = state.soilMoistureMap.map((m) => {
    let result = m
    if (weather.type === 'rainy') {
      result = Math.min(1, result + 0.001 * dt)
    }
    if (waterLaneActivity > PLANT_ACTIVITY_THRESHOLD) {
      // water lane affects all lanes slightly
      result = Math.min(1, result + 0.0003 * dt * waterLaneActivity)
    }
    // natural decay
    result = Math.max(0, result - 0.0001 * dt)
    return result
  })

  // ── Plant lane actions ────────────────────────────────────────────────
  let plants = state.plants
  let nextPlantId = state.nextPlantId
  let totalBloomed = state.totalBloomed

  // Seed lane (lane 0): plant new seeds
  const seedLaneActivity = lanes[0].activity
  if (seedLaneActivity > PLANT_ACTIVITY_THRESHOLD * 1.5) {
    const seedsInLanes = new Array(NUM_LANES).fill(0)
    for (const p of plants) {
      if (p.stage === 'seed' || p.stage === 'sprout') {
        seedsInLanes[p.lane]++
      }
    }
    // Pick a lane with fewer plants to seed in
    const availableLanes = []
    for (let i = 0; i < NUM_LANES; i++) {
      const plantsInLane = plants.filter((p) => p.lane === i).length
      if (plantsInLane < MAX_PLANTS_PER_LANE) {
        availableLanes.push(i)
      }
    }
    if (availableLanes.length > 0) {
      // Prefer random lane, weighted toward middle
      const targetLane = availableLanes[Math.floor(Math.random() * availableLanes.length)]
      const plantsInTarget = plants.filter((p) => p.lane === targetLane).length
      if (plantsInTarget < MAX_PLANTS_PER_LANE && Math.random() < seedLaneActivity * 0.08) {
        const newPlant: PlantState = {
          id: nextPlantId++,
          lane: targetLane,
          stage: 'seed',
          growthProgress: 0,
          heightPx: PLANT_HEIGHTS.seed,
          targetHeightPx: PLANT_HEIGHTS.seed,
          growthMultiplier: 1,
          rainBoostTimer: 0,
          swayOffset: Math.random() * Math.PI * 2,
          colorSeed: Math.random(),
        }
        plants = [...plants, newPlant]
      }
    }
  }

  // ── Update plants ────────────────────────────────────────────────────
  const isDaytime = timeOfDay === 'day' || timeOfDay === 'dawn'
  const isDawn = timeOfDay === 'dawn'
  const isDusk = timeOfDay === 'dusk'

  const updatedPlants: PlantState[] = []
  const sparkles: SparkleParticle[] = [...state.sparkleParticles]

  for (const plant of plants) {
    let growthMult: number

    // Only grow during the day
    if (isDaytime) {
      growthMult = BASE_GROWTH_RATE
      // Dawn gives a slight boost
      if (isDawn) growthMult *= 1.3
      // Moisture boost
      if (soilMoistureMap[plant.lane] > 0.2) {
        growthMult *= 1 + MOISTURE_GROWTH_BOOST * soilMoistureMap[plant.lane]
      }
      // Rain boost (lasts after rain)
      if (plant.rainBoostTimer > 0 || rainBoostTimer > 0) {
        growthMult *= RAIN_GROWTH_BOOST
      }
      // Sun lane activity boost during day
      if (sunLaneActivity > PLANT_ACTIVITY_THRESHOLD) {
        growthMult *= 1 + sunLaneActivity * 2
      }
    } else if (isDusk) {
      // Slight growth during dusk
      growthMult = BASE_GROWTH_RATE * 0.3
      if (soilMoistureMap[plant.lane] > 0.3) {
        growthMult *= 1 + MOISTURE_GROWTH_BOOST * soilMoistureMap[plant.lane] * 0.5
      }
    } else {
      // Night: no growth
      growthMult = 0
    }

    let progress = plant.growthProgress + growthMult * dt
    let stage = plant.stage
    let rainBoost = Math.max(0, plant.rainBoostTimer - RAIN_BOOST_DECAY * dt)

    // If it's currently raining, apply boost
    if (weather.type === 'rainy') {
      rainBoost = RAIN_BOOST_DURATION
    }

    // Advance stage
    if (stage === 'seed' && progress >= STAGE_DURATIONS.seed) {
      stage = 'sprout'
      progress = 0
    } else if (stage === 'sprout' && progress >= STAGE_DURATIONS.sprout) {
      stage = 'growing'
      progress = 0
    } else if (stage === 'growing' && progress >= STAGE_DURATIONS.growing) {
      stage = 'bud'
      progress = 0
    } else if (stage === 'bud' && progress >= STAGE_DURATIONS.bud) {
      stage = 'bloom'
      progress = 0
      totalBloomed++
      // Sparkles on bloom!
      const plantX = (plant.lane + 0.5) * laneWidth
      const plantTopY = groundY - plant.heightPx - 20
      for (let i = 0; i < 8; i++) {
        sparkles.push({
          x: plantX + (Math.random() - 0.5) * 30,
          y: plantTopY + (Math.random() - 0.5) * 20,
          life: 800 + Math.random() * 400,
          maxLife: 1200,
          size: 2 + Math.random() * 3,
          color: [0xFFEE58, 0xFF7043, 0xAB47BC, 0x42A5F5, 0x66BB6A][Math.floor(Math.random() * 5)],
        })
      }
    } else if (stage === 'bloom' && progress >= STAGE_DURATIONS.bloom) {
      stage = 'fruiting'
      progress = 0
    }

    const targetHeight = PLANT_HEIGHTS[stage] * (stage === 'seed' ? 1 : (1 + progress * 0.3))

    updatedPlants.push({
      ...plant,
      stage,
      growthProgress: stage === plant.stage ? progress : 0,
      heightPx: plant.heightPx + (targetHeight - plant.heightPx) * 0.05,
      targetHeightPx: targetHeight,
      growthMultiplier: growthMult,
      rainBoostTimer: rainBoost,
    })
  }

  // ── Rain drops ───────────────────────────────────────────────────────
  let rainDrops = state.rainDrops

  if (weather.type === 'rainy') {
    const dropsPerFrame = Math.floor(2 + weather.rainIntensity * 4)
    for (let i = 0; i < dropsPerFrame; i++) {
      rainDrops.push({
        x: Math.random() * stageWidth,
        y: -10,
        speed: 6 + Math.random() * 4 + weather.rainIntensity * 3,
        length: 8 + Math.random() * 12,
        opacity: 0.3 + Math.random() * 0.4,
      })
    }
  }

  // Water lane also creates a gentle rain in that lane
  if (waterLaneActivity > PLANT_ACTIVITY_THRESHOLD) {
    const waterLaneCenter = 1.5 * laneWidth // water lane is lane 1
    for (let i = 0; i < 2; i++) {
      rainDrops.push({
        x: waterLaneCenter + (Math.random() - 0.5) * laneWidth * 0.8,
        y: -5,
        speed: 4 + Math.random() * 3,
        length: 6 + Math.random() * 8,
        opacity: 0.2 + Math.random() * 0.3,
      })
    }
  }

  rainDrops = rainDrops
    .map((d) => ({ ...d, y: d.y + d.speed }))
    .filter((d) => d.y < stageHeight + 20)

  // ── Update sparkles ───────────────────────────────────────────────────
  const updatedSparkles = sparkles
    .map((s) => ({ ...s, life: s.life - dt }))
    .filter((s) => s.life > 0)

  // ── Harvest flash decay ───────────────────────────────────────────────
  const harvestFlash = Math.max(0, state.harvestFlash - dt * 0.002)

  return {
    phase: state.phase,
    plants: updatedPlants,
    rainDrops,
    leafParticles: state.leafParticles,
    sparkleParticles: updatedSparkles,
    dayNight,
    weather,
    lanes,
    moistureLevel,
    rainBoostDecay: rainBoostTimer,
    totalBloomed,
    time,
    nextPlantId,
    harvestFlash,
    soilMoistureMap,
  }
}
