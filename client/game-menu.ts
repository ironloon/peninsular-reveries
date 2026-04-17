import { setupTabbedModal, type ModalControls } from './modal.js'
import { bindMusicToggle, bindSfxToggle, bindReduceMotionToggle } from './preferences.js'
import { MUSIC_TRACKS, getSelectedTrackId, setSelectedTrackId } from './music-catalog.js'

export interface GameMenuConfig {
  /** Whether to build the music track picker. Default: true */
  musicTrackPicker?: boolean
}

export function setupGameMenu(config?: GameMenuConfig): ModalControls {
  const showTrackPicker = config?.musicTrackPicker ?? true

  if (showTrackPicker) {
    buildTrackPicker()
  }

  const modal = setupTabbedModal()

  bindMusicToggle(
    document.getElementById('music-enabled-toggle') as HTMLInputElement | null,
    document.getElementById('music-enabled-help') as HTMLElement | null,
  )
  bindSfxToggle(
    document.getElementById('sfx-enabled-toggle') as HTMLInputElement | null,
    document.getElementById('sfx-enabled-help') as HTMLElement | null,
  )
  bindReduceMotionToggle(
    document.getElementById('reduce-motion-toggle') as HTMLInputElement | null,
    document.getElementById('reduce-motion-help') as HTMLElement | null,
  )

  return modal
}

function buildTrackPicker(): void {
  const slot = document.getElementById('music-track-picker-slot')
  if (!slot || MUSIC_TRACKS.length === 0) return

  const label = document.createElement('label')
  label.className = 'settings-track-picker'
  label.htmlFor = 'music-track-select'

  const labelText = document.createElement('span')
  labelText.textContent = 'Track'
  label.appendChild(labelText)

  const select = document.createElement('select')
  select.id = 'music-track-select'
  select.setAttribute('aria-label', 'Music track')

  const currentTrackId = getSelectedTrackId()

  for (const track of MUSIC_TRACKS) {
    const option = document.createElement('option')
    option.value = track.id
    option.textContent = track.name
    if (track.id === currentTrackId) {
      option.selected = true
    }
    select.appendChild(option)
  }

  if (!currentTrackId && select.options.length > 0) {
    select.options[0].selected = true
  }

  select.addEventListener('change', () => {
    setSelectedTrackId(select.value)
    window.dispatchEvent(new CustomEvent('reveries:music-track-change', { detail: { trackId: select.value } }))
  })

  label.appendChild(select)
  slot.appendChild(label)
}
