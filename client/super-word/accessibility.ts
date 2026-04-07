function announce(message: string, priority: 'polite' | 'assertive'): void {
  const el = document.getElementById(priority === 'assertive' ? 'game-feedback' : 'game-status')
  if (el) el.textContent = message
}

export function announceLetterCollected(char: string, label: string, collected: number, total: number): void {
  announce(`Collected letter ${char} from ${label}. ${collected} of ${total} letters found.`, 'assertive')
}

export function announceDistractorClicked(label: string): void {
  announce(`That's not a letter! ${label} is a distractor.`, 'assertive')
}

export function announceLetterSelected(char: string, position: number): void {
  announce(`Selected letter ${char} at position ${position}. Tap another letter to swap.`, 'polite')
}

export function announceLettersSwapped(char1: string, char2: string, allLetters: string[]): void {
  announce(`Swapped ${char1} and ${char2}. Letters now: ${allLetters.join(' ')}.`, 'polite')
}

export function announceLetterMoved(char: string, position: number): void {
  announce(`Moved ${char} to position ${position}.`, 'polite')
}

export function announceWrongAnswer(): void {
  announce('Not quite! Try rearranging the letters.', 'assertive')
}

export function announceCorrectAnswer(word: string): void {
  announce(`Correct! You spelled ${word}!`, 'assertive')
}

export function announceNextPuzzle(puzzleNum: number, total: number, prompt: string): void {
  announce(`Puzzle ${puzzleNum} of ${total}. ${prompt}`, 'polite')
}

export function announceGameWin(score: number): void {
  announce(`Congratulations! You solved all 5 puzzles! Final score: ${score}.`, 'assertive')
}

export function moveFocus(element: HTMLElement): void {
  requestAnimationFrame(() => element.focus())
}

export function moveFocusAfterTransition(elementId: string, delayMs: number = 300): void {
  setTimeout(() => {
    const el = document.getElementById(elementId)
    if (el) requestAnimationFrame(() => el.focus())
  }, delayMs)
}

export function moveFocusToFirstSceneItem(delayMs: number = 300): void {
  setTimeout(() => {
    const selector = '#scene-a11y .sr-overlay-btn[data-item-type="letter"][tabindex="0"], #scene-a11y .sr-overlay-btn[data-item-type="letter"], #scene-a11y .sr-overlay-btn[tabindex="0"], #scene-a11y .sr-overlay-btn'
    const el = document.querySelector(selector) as HTMLElement | null
    if (!el) return
    if (el.tabIndex < 0) {
      el.tabIndex = 0
    }
    requestAnimationFrame(() => el.focus())
  }, delayMs)
}
