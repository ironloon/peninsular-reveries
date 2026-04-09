import { weatherStory } from './story-weather.js'
import { plantsStory } from './story-plants.js'
import { habitatsStory } from './story-habitats.js'
import { helpersStory } from './story-helpers.js'
import { sensesStory } from './story-senses.js'
import type { Story } from './types.js'

export const allStories: readonly Story[] = [
  weatherStory,
  plantsStory,
  habitatsStory,
  helpersStory,
  sensesStory,
] as const
