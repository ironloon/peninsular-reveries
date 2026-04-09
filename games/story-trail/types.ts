export interface Item {
  readonly id: string
  readonly name: string
  readonly description: string
}

export interface Choice {
  readonly text: string
  readonly targetSceneId: string
  readonly requiredItemId?: string
  readonly hint?: string
  readonly grantsItemId?: string
}

export interface Scene {
  readonly id: string
  readonly description: string
  readonly choices: readonly Choice[]
  readonly isEnd?: boolean
  readonly illustration?: string
}

export interface Story {
  readonly id: string
  readonly title: string
  readonly icon: string
  readonly theme: string
  readonly description: string
  readonly startSceneId: string
  readonly scenes: readonly Scene[]
  readonly items: readonly Item[]
  readonly badgeEmoji: string
  readonly badgeName: string
}

export interface GameState {
  readonly currentStoryId: string | null
  readonly currentSceneId: string | null
  readonly inventory: readonly string[]
  readonly completedStoryIds: readonly string[]
  readonly earnedBadges: readonly string[]
  readonly lastHint: string | null
  readonly lastCollectedItem: string | null
}
