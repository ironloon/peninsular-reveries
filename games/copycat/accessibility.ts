import { announce } from '../../client/game-accessibility.js'
import type { Pose } from './types.js'

const POSE_MESSAGES: Record<Pose, string> = {
  idle: 'Idle',
  'left-paw-up': 'Left paw up!',
  'right-paw-up': 'Right paw up!',
  'both-paws-up': 'Both paws up!',
  crouch: 'Crouch!',
  jump: 'Jump!',
  'lean-left': 'Lean left!',
  'lean-right': 'Lean right!',
}

export function announcePose(pose: Pose): void {
  const message = POSE_MESSAGES[pose]
  if (message) {
    announce(message, 'polite')
  }
}

export function announceCatJoin(_catIndex: number): void {
  announce('A new dancer joined the crew!', 'assertive')
}

export function announceSongMilestone(progress: number): void {
  if (progress >= 0.25 && progress < 0.3) {
    announce('Getting started!', 'polite')
  } else if (progress >= 0.5 && progress < 0.55) {
    announce('Halfway there!', 'polite')
  } else if (progress >= 0.75 && progress < 0.8) {
    announce('Almost done!', 'polite')
  }
}

import { moveFocusAfterTransition as baseMoveFocusAfterTransition } from '../../client/game-accessibility.js'

export function moveFocusAfterTransition(elementId: string, delayMs: number): void {
  baseMoveFocusAfterTransition(elementId, delayMs)
}
