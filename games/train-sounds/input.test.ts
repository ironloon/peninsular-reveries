import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, test } from 'node:test'

interface MockRect {
  left: number
  top: number
  width: number
  height: number
  right: number
  bottom: number
}

interface MockEvent {
  readonly type: string
  readonly target: MockElement | null
  readonly key?: string
  readonly repeat?: boolean
  readonly ctrlKey?: boolean
  readonly altKey?: boolean
  readonly metaKey?: boolean
  defaultPrevented: boolean
  preventDefault(): void
}

type MockListener = (event: MockEvent) => void

class MockClassList {
  private readonly tokens = new Set<string>()

  add(...tokens: readonly string[]): void {
    for (const token of tokens) {
      this.tokens.add(token)
    }
  }

  remove(...tokens: readonly string[]): void {
    for (const token of tokens) {
      this.tokens.delete(token)
    }
  }

  contains(token: string): boolean {
    return this.tokens.has(token)
  }
}

class MockEventTarget {
  private readonly listeners = new Map<string, MockListener[]>()

  addEventListener(type: string, listener: MockListener): void {
    const listeners = this.listeners.get(type) ?? []
    listeners.push(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: MockListener): void {
    const listeners = this.listeners.get(type)
    if (!listeners) return
    this.listeners.set(
      type,
      listeners.filter((registered) => registered !== listener),
    )
  }

  protected emit(type: string, event: MockEvent): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event)
    }
  }
}

class MockDocument extends MockEventTarget {
  readonly body: MockElement
  activeElement: MockElement | null = null
  visibilityState = 'visible'

  constructor() {
    super()
    this.body = new MockElement(this, 'body')
  }

  createElement(tagName: string): MockElement {
    return tagName.toUpperCase() === 'BUTTON'
      ? new MockButtonElement(this)
      : new MockElement(this, tagName)
  }

  getElementById(id: string): MockElement | null {
    return this.body.findById(id)
  }

  querySelector(selector: string): MockElement | null {
    return this.body.querySelector(selector)
  }

  dispatchKeydown(
    key: string,
    options: {
      readonly target?: MockElement | null
      readonly repeat?: boolean
      readonly ctrlKey?: boolean
      readonly altKey?: boolean
      readonly metaKey?: boolean
    } = {},
  ): MockEvent {
    const event: MockEvent = {
      type: 'keydown',
      target: options.target ?? this.body,
      key,
      repeat: options.repeat ?? false,
      ctrlKey: options.ctrlKey ?? false,
      altKey: options.altKey ?? false,
      metaKey: options.metaKey ?? false,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true
      },
    }

    this.emit('keydown', event)
    return event
  }
}

class MockElement extends MockEventTarget {
  readonly ownerDocument: MockDocument
  readonly tagName: string
  readonly classList = new MockClassList()
  readonly dataset: Record<string, string> = {}
  readonly style: Record<string, string> = {}
  readonly children: MockElement[] = []
  parentElement: MockElement | null = null
  id = ''
  disabled = false
  isContentEditable = false
  private readonly attributes = new Map<string, string>()
  private rect: MockRect

  constructor(document: MockDocument, tagName: string) {
    super()
    this.ownerDocument = document
    this.tagName = tagName.toUpperCase()
    this.rect = {
      left: 0,
      top: 0,
      width: 80,
      height: 40,
      right: 80,
      bottom: 40,
    }
  }

  append(...children: readonly MockElement[]): void {
    for (const child of children) {
      child.parentElement = this
      this.children.push(child)
    }
  }

  setRect(left: number, top: number, width: number = 80, height: number = 40): this {
    this.rect = {
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    }
    return this
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)

    if (name === 'id') {
      this.id = value
      return
    }

    if (name.startsWith('data-')) {
      this.dataset[toDatasetKey(name.slice('data-'.length))] = value
    }
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name)

    if (name.startsWith('data-')) {
      delete this.dataset[toDatasetKey(name.slice('data-'.length))]
    }
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name)
  }

  matches(selector: string): boolean {
    if (selector === '[hidden]') {
      return this.hasAttribute('hidden')
    }

    if (selector === '.train-hotspot') {
      return this.classList.contains('train-hotspot')
    }

    if (selector === '[data-settings-open="true"]') {
      return this.dataset.settingsOpen === 'true'
    }

    if (selector === '.screen.active:not([hidden])') {
      return this.classList.contains('screen')
        && this.classList.contains('active')
        && !this.hasAttribute('hidden')
    }

    return false
  }

  closest(selector: string): MockElement | null {
    if (this.matches(selector)) {
      return this
    }

    let current: MockElement | null = this.parentElement
    while (current) {
      if (current.matches(selector)) {
        return current
      }
      current = current.parentElement
    }
    return null
  }

  querySelectorAll(selector: string): MockElement[] {
    const matches: MockElement[] = []
    const isFocusableQuery = selector.includes('button:not([disabled])')

    const visit = (node: MockElement): void => {
      for (const child of node.children) {
        if (isFocusableQuery ? child.isFocusable() : child.matches(selector)) {
          matches.push(child)
        }
        visit(child)
      }
    }

    visit(this)
    return matches
  }

  querySelector(selector: string): MockElement | null {
    return this.querySelectorAll(selector)[0] ?? null
  }

  findById(id: string): MockElement | null {
    if (this.id === id) {
      return this
    }

    for (const child of this.children) {
      const match = child.findById(id)
      if (match) {
        return match
      }
    }

    return null
  }

  getClientRects(): readonly MockRect[] {
    return this.isVisible() ? [this.rect] : []
  }

  getBoundingClientRect(): MockRect {
    return this.rect
  }

  focus(): void {
    this.ownerDocument.activeElement = this
  }

  scrollIntoView(): void {}

  click(): void {
    this.emit('click', {
      type: 'click',
      target: this,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true
      },
    })
  }

  private isFocusable(): boolean {
    return this.tagName === 'BUTTON'
      && !this.disabled
      && !this.closest('[hidden]')
      && this.getClientRects().length > 0
  }

  private isVisible(): boolean {
    return !this.closest('[hidden]')
  }
}

class MockButtonElement extends MockElement {
  constructor(document: MockDocument) {
    super(document, 'button')
  }
}

interface MockGamepadButton {
  pressed: boolean
}

interface InputHarness {
  readonly document: MockDocument
  readonly body: MockElement
  readonly menuButton: MockButtonElement
  readonly prevButton: MockButtonElement
  readonly nextButton: MockButtonElement
  readonly closeButton: MockButtonElement
  readonly modal: MockElement
  readonly hotspotButtons: readonly MockButtonElement[]
  readonly gamepadButtons: MockGamepadButton[]
}

let rafCallbacks = new Map<number, FrameRequestCallback>()
let nextRafId = 1
let nowMs = 0
const realDateNow = Date.now

function toDatasetKey(value: string): string {
  return value.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
}

function createButton(
  document: MockDocument,
  id: string,
  classNames: readonly string[] = [],
): MockButtonElement {
  const button = new MockButtonElement(document)
  button.id = id
  for (const className of classNames) {
    button.classList.add(className)
  }
  return button
}

function installGlobals(document: MockDocument, gamepadButtons: MockGamepadButton[]): void {
  Object.assign(globalThis, {
    Element: MockElement,
    HTMLElement: MockElement,
    HTMLButtonElement: MockButtonElement,
    document,
    window: {
      document,
      addEventListener() {},
      removeEventListener() {},
    },
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      const id = nextRafId
      nextRafId += 1
      rafCallbacks.set(id, callback)
      return id
    },
    cancelAnimationFrame: (id: number) => {
      rafCallbacks.delete(id)
    },
  })

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      getGamepads: () => [{ buttons: gamepadButtons, axes: [0, 0] }, null, null, null],
    },
  })
}

function runAnimationFrame(): void {
  const callbacks = [...rafCallbacks.values()]
  rafCallbacks = new Map()
  for (const callback of callbacks) {
    callback(nowMs)
  }
}

function setGamepadButton(buttons: MockGamepadButton[], index: number, pressed: boolean): void {
  buttons[index] = { pressed }
}

function createInputHarness(modalOpen: boolean = false): InputHarness {
  const document = new MockDocument()
  const body = document.body
  const gamepadButtons = Array.from({ length: 16 }, () => ({ pressed: false }))

  const startScreen = document.createElement('section')
  startScreen.id = 'start-screen'
  startScreen.classList.add('screen')
  const startButton = createButton(document, 'start-btn')
  startScreen.append(startButton)

  const gameScreen = document.createElement('section')
  gameScreen.id = 'game-screen'
  gameScreen.classList.add('screen', 'active')

  const menuButton = createButton(document, 'menu-btn')
  menuButton.setAttribute('data-settings-open', 'true')
  menuButton.setRect(24, 16)

  const prevButton = createButton(document, 'train-prev-btn')
  prevButton.setRect(24, 88)

  const nextButton = createButton(document, 'train-next-btn')
  nextButton.setRect(156, 88)

  const hotspotOne = createButton(document, 'steam-whistle', ['train-hotspot'])
  hotspotOne.setRect(60, 160)

  const hotspotTwo = createButton(document, 'steam-bell', ['train-hotspot'])
  hotspotTwo.setRect(156, 160)

  gameScreen.append(menuButton, prevButton, nextButton, hotspotOne, hotspotTwo)

  const modal = document.createElement('div')
  modal.id = 'settings-modal'
  if (!modalOpen) {
    modal.setAttribute('hidden', '')
  }

  const closeButton = createButton(document, 'settings-close-btn')
  closeButton.setRect(24, 24)
  modal.append(closeButton)

  body.append(startScreen, gameScreen, modal)
  installGlobals(document, gamepadButtons)

  return {
    document,
    body,
    menuButton,
    prevButton,
    nextButton,
    closeButton,
    modal,
    hotspotButtons: [hotspotOne, hotspotTwo],
    gamepadButtons,
  }
}

beforeEach(() => {
  nowMs = 0
  rafCallbacks = new Map()
  nextRafId = 1
  Date.now = () => nowMs
})

afterEach(() => {
  cleanupTrainSoundsInput()
  Date.now = realDateNow
  rafCallbacks = new Map()
})

import {
  cleanupTrainSoundsInput,
  setupTrainSoundsInput,
} from './input.js'

describe('Train Sounds keyboard input', () => {
  test('ArrowLeft and ArrowRight switch trains from the game screen controls', () => {
    const harness = createInputHarness()
    const clicks = { previous: 0, next: 0 }

    harness.prevButton.addEventListener('click', () => {
      clicks.previous += 1
    })
    harness.nextButton.addEventListener('click', () => {
      clicks.next += 1
    })

    setupTrainSoundsInput()

    const leftEvent = harness.document.dispatchKeydown('ArrowLeft')
    const rightEvent = harness.document.dispatchKeydown('ArrowRight')

    assert.equal(leftEvent.defaultPrevented, true)
    assert.equal(rightEvent.defaultPrevented, true)
    assert.equal(clicks.previous, 1)
    assert.equal(clicks.next, 1)
    assert.equal(harness.document.activeElement, harness.nextButton)
  })

  test('modal-safe keyboard handling suppresses train switching while still allowing Escape to close the modal', () => {
    const harness = createInputHarness(true)
    const clicks = { next: 0, close: 0 }

    harness.nextButton.addEventListener('click', () => {
      clicks.next += 1
    })
    harness.closeButton.addEventListener('click', () => {
      clicks.close += 1
    })

    setupTrainSoundsInput()

    const arrowEvent = harness.document.dispatchKeydown('ArrowRight')
    const escapeEvent = harness.document.dispatchKeydown('Escape')

    assert.equal(arrowEvent.defaultPrevented, false)
    assert.equal(clicks.next, 0)
    assert.equal(escapeEvent.defaultPrevented, true)
    assert.equal(clicks.close, 1)
  })
})

describe('Train Sounds gamepad input', () => {
  test('D-pad focus navigation and A activation target the current control', () => {
    const harness = createInputHarness()
    let nextClicks = 0

    harness.nextButton.addEventListener('click', () => {
      nextClicks += 1
    })

    setupTrainSoundsInput()

    nowMs = 250
    setGamepadButton(harness.gamepadButtons, 15, true)
    runAnimationFrame()

    assert.equal(harness.document.activeElement, harness.nextButton)
    assert.equal(harness.body.classList.contains('gamepad-active'), true)
    assert.equal(harness.nextButton.classList.contains('gamepad-focus'), true)

    nowMs = 300
    setGamepadButton(harness.gamepadButtons, 15, false)
    runAnimationFrame()

    nowMs = 520
    setGamepadButton(harness.gamepadButtons, 0, true)
    runAnimationFrame()

    assert.equal(nextClicks, 1)
  })

  test('Start opens the menu and closes an open modal', () => {
    const harness = createInputHarness()
    const clicks = { menu: 0, close: 0 }

    harness.menuButton.addEventListener('click', () => {
      clicks.menu += 1
    })
    harness.closeButton.addEventListener('click', () => {
      clicks.close += 1
    })

    setupTrainSoundsInput()

    nowMs = 250
    setGamepadButton(harness.gamepadButtons, 9, true)
    runAnimationFrame()

    assert.equal(clicks.menu, 1)

    nowMs = 320
    setGamepadButton(harness.gamepadButtons, 9, false)
    runAnimationFrame()

    harness.modal.removeAttribute('hidden')
    nowMs = 560
    setGamepadButton(harness.gamepadButtons, 9, true)
    runAnimationFrame()

    assert.equal(clicks.close, 1)
  })
})