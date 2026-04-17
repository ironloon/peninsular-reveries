import type { Story, Scene, Item, GameState } from './types.js'

// ── Lazy element cache ───────────────────────────────────────
let sceneViewEl: HTMLElement | null = null
function getSceneView(): HTMLElement { return sceneViewEl ??= document.getElementById('scene-view')! }
let sceneIllustrationEl: HTMLElement | null = null
function getSceneIllustration(): HTMLElement { return sceneIllustrationEl ??= document.getElementById('scene-illustration')! }
let sceneTextEl: HTMLElement | null = null
function getSceneText(): HTMLElement { return sceneTextEl ??= document.getElementById('scene-text')! }
let hintAreaEl: HTMLElement | null = null
function getHintArea(): HTMLElement { return hintAreaEl ??= document.getElementById('hint-area')! }
let itemFlashEl: HTMLElement | null = null
function getItemFlash(): HTMLElement { return itemFlashEl ??= document.getElementById('item-flash')! }
let choicesEl: HTMLElement | null = null
function getChoices(): HTMLElement { return choicesEl ??= document.getElementById('choices')! }
let inventoryBarEl: HTMLElement | null = null
function getInventoryBar(): HTMLElement { return inventoryBarEl ??= document.getElementById('inventory-bar')! }
let completionViewEl: HTMLElement | null = null
function getCompletionView(): HTMLElement { return completionViewEl ??= document.getElementById('completion-view')! }
let inventoryOverlayEl: HTMLElement | null = null
function getInventoryOverlay(): HTMLElement { return inventoryOverlayEl ??= document.getElementById('inventory-overlay')! }
let gameAreaEl: HTMLElement | null = null
function getGameArea(): HTMLElement { return gameAreaEl ??= document.getElementById('game-area')! }

export { getSceneText, getItemFlash, getHintArea, getInventoryOverlay }

// ── Screen management ────────────────────────────────────────

export function showScreen(screenId: string): void {
  getGameArea().dataset['activeScreen'] = screenId
}

// ── Scene view ───────────────────────────────────────────────

export function renderScene(story: Story, scene: Scene, state: GameState): void {
  getSceneIllustration().textContent = scene.illustration ?? ''
  getSceneText().textContent = scene.description
  getHintArea().setAttribute('hidden', '')
  getItemFlash().setAttribute('hidden', '')

  updateSceneChoices(scene, state)
  updateInventoryBar(story, state)
}

export function updateSceneChoices(scene: Scene, state: GameState): void {
  const choicesEl = getChoices()
  choicesEl.innerHTML = ''
  for (let i = 0; i < scene.choices.length; i++) {
    const choice = scene.choices[i]
    const hasRequiredItem = !choice.requiredItemId || state.equippedItemId === choice.requiredItemId
    const btn = document.createElement('button')
    btn.className = `choice-btn${hasRequiredItem ? '' : ' choice-locked'}`
    btn.dataset['choiceIndex'] = String(i)
    btn.type = 'button'
    btn.textContent = choice.text + (!hasRequiredItem && choice.requiredItemId ? ' 🔒' : '')
    choicesEl.appendChild(btn)
  }
}

// ── Inventory overlay ────────────────────────────────────────

export function renderInventoryOverlay(story: Story, state: GameState): void {
  const selectedItem = state.equippedItemId
    ? story.items.find(item => item.id === state.equippedItemId)
    : undefined

  let html = '<div class="inventory-overlay-panel">'
  html += '<h2 id="inventory-heading" class="inventory-heading">Your Bag</h2>'
  html += `<p class="inventory-help">${selectedItem ? `Holding ${selectedItem.name}. Tap it again to put it away.` : 'Pick one item to hold.'}</p>`

  if (state.inventory.length === 0) {
    html += '<p class="inventory-empty">Your bag is empty.</p>'
  } else {
    html += '<div class="inventory-list" role="group" aria-label="Bag items">'
    for (const itemId of state.inventory) {
      const item = story.items.find(it => it.id === itemId)
      if (item) {
        const isSelected = state.equippedItemId === item.id
        html += `<button class="inventory-overlay-item${isSelected ? ' is-selected' : ''}" type="button" data-inventory-item-id="${item.id}" aria-pressed="${isSelected ? 'true' : 'false'}"><span class="inv-name">${item.name}</span><span class="inv-desc">${item.description}</span></button>`
      }
    }
    html += '</div>'
  }
  html += '<button class="inventory-close-btn" id="inventory-close-btn" type="button">Close</button>'
  html += '</div>'

  const overlay = getInventoryOverlay()
  overlay.innerHTML = html
  overlay.setAttribute('aria-labelledby', 'inventory-heading')
}

// ── Story completion ─────────────────────────────────────────

export function renderStoryComplete(endScene: Scene): void {
  getCompletionView().innerHTML = `<div class="completion-badge">${endScene.illustration ?? ''}</div>
<p class="completion-title">${endScene.description}</p>
<p class="completion-msg">The End</p>
<button id="play-again-btn" class="play-again-btn" type="button">Play Again</button>`
}

// ── Hint and item flash ──────────────────────────────────────

export function renderHint(hint: string): void {
  const el = getHintArea()
  el.textContent = hint
  el.removeAttribute('hidden')
}

export function renderItemCollected(item: Item): void {
  const el = getItemFlash()
  el.textContent = `You found: ${item.name}!`
  el.removeAttribute('hidden')
}

// ── Inventory bar ────────────────────────────────────────────

export function updateInventoryBar(story: Story, state: GameState): void {
  const bar = getInventoryBar()
  bar.innerHTML = ''

  const bagButton = document.createElement('button')
  bagButton.className = 'inventory-bag-btn'
  bagButton.id = 'inventory-btn'
  bagButton.type = 'button'
  bagButton.textContent = 'Bag'
  bagButton.setAttribute('aria-haspopup', 'dialog')
  bagButton.setAttribute('aria-controls', 'inventory-overlay')
  bagButton.setAttribute('aria-expanded', getInventoryOverlay().hidden ? 'false' : 'true')
  if (!getInventoryOverlay().hidden) {
    bagButton.classList.add('is-open')
  }
  bar.appendChild(bagButton)

  if (state.inventory.length === 0) {
    const span = document.createElement('span')
    span.className = 'inventory-empty-label'
    span.textContent = 'Bag: empty'
    bar.appendChild(span)
  } else {
    for (const itemId of state.inventory) {
      const item = story.items.find(it => it.id === itemId)
      if (item) {
        const button = document.createElement('button')
        button.className = 'inventory-item-btn'
        button.type = 'button'
        button.title = item.description
        button.textContent = item.name
        button.dataset['inventoryItemId'] = item.id
        button.setAttribute('aria-pressed', state.equippedItemId === item.id ? 'true' : 'false')
        if (state.equippedItemId === item.id) {
          button.classList.add('is-selected')
        }
        bar.appendChild(button)
      }
    }
  }
}

// Suppress unused variable warnings for getters wired via the lazy-cache export path.
void getSceneView
