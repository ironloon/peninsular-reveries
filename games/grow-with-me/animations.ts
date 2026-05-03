import { Container } from 'pixi.js'
import { isReducedMotionEnabled } from '../../client/preferences.js'
import type { PlantState, TimeOfDay } from './types.js'

export function applyPlantSway(container: Container, t: number, plant: PlantState): void {
  if (isReducedMotionEnabled()) return

  const swayAmount = plant.stage === 'bloom' ? 0.06 : plant.stage === 'fruiting' ? 0.03 : 0.04
  const swaySpeed = plant.stage === 'bloom' ? 2.0 : 1.5
  container.rotation = Math.sin(t * swaySpeed + plant.swayOffset) * swayAmount
}

export function applyDayNightTint(container: Container, timeOfDay: TimeOfDay, skyBrightness: number): void {
  switch (timeOfDay) {
    case 'night':
      container.alpha = 0.75
      container.filters = undefined
      break
    case 'dusk':
      container.alpha = 0.85 + skyBrightness * 0.15
      break
    case 'dawn':
      container.alpha = 0.85 + skyBrightness * 0.15
      break
    default:
      container.alpha = 1
  }
}

export function applyRainSway(container: Container, isRaining: boolean, t: number, offset: number): void {
  if (!isRaining || isReducedMotionEnabled()) return
  container.rotation = Math.sin(t * 3 + offset) * 0.08
}