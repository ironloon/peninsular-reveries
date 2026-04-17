import { announce, moveFocusAfterTransition } from '../../client/game-accessibility.js'

export { moveFocusAfterTransition }

export function announcePhase(message: string): void {
  announce(message, 'polite')
}

export function announceMarkerSelection(label: string, isCurrent: boolean = false): void {
  announce(
    isCurrent
      ? `${label}. You are here. Press enter to read it again.`
      : `${label}. Press enter to go.`,
    'polite',
  )
}

export function announceTravel(from: string, to: string, transport: string): void {
  announce(`Traveling by ${transport} from ${from} to ${to}.`, 'assertive')
}

export function announceRevisit(name: string, country: string): void {
  announce(`You are here in ${name}, ${country}. Reading this place again.`, 'assertive')
}

export function announceDestination(name: string, country: string): void {
  announce(`You are in ${name}, ${country}.`, 'assertive')
}

export function announceFact(fact: string): void {
  announce(fact, 'polite')
}