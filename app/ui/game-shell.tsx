import { css, type RemixNode } from 'remix/component'
import { gameHeaderStyles, gameHeaderPillStyles, settingsSectionStyles, settingsToggleStyles, settingsActionsStyles } from './site-styles.js'

type StyleObject = Parameters<typeof css>[0]

export const gameBodyStyles = {
  '&.modal-open': {
    overflow: 'hidden',
  },
}

export const gameMainStyles = {
  display: 'flex',
  flex: '1 1 auto',
  width: '100%',
  minHeight: 0,
  minWidth: 0,
  maxWidth: '100vw',
  margin: 0,
  padding: 0,
  overflow: 'hidden',
}

const gameScreenBaseStyles = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'safe center',
  transform: 'translateX(100%)',
  transition: 'transform 520ms cubic-bezier(0.33, 1, 0.68, 1)',
  visibility: 'hidden',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  WebkitOverflowScrolling: 'touch',
  '&.active': {
    transform: 'translateX(0)',
    visibility: 'visible',
  },
  '&.leaving': {
    transform: 'translateX(-100%)',
    visibility: 'visible',
  },
}

const paddedGameScreenStyles = {
  padding: 'clamp(0.9rem, 2.5vw, 1.6rem)',
}

const settingsModalBaseStyles = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  display: 'none',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'auto',
  pointerEvents: 'auto',
  padding:
    'max(1rem, env(safe-area-inset-top, 0px)) max(1rem, env(safe-area-inset-right, 0px)) max(1rem, env(safe-area-inset-bottom, 0px)) max(1rem, env(safe-area-inset-left, 0px))',
  background: 'rgba(4, 10, 20, 0.72)',
  '&:not([hidden])': {
    display: 'flex',
  },
}

const srOnlyStyles = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

type ScreenElement = 'div' | 'section'
type SrOnlyElement = 'div' | 'h1' | 'h2' | 'h3' | 'p' | 'span'

interface GameScreenProps {
  id: string
  className?: string
  labelledBy?: string
  padded?: boolean
  as?: ScreenElement
  screenStyles?: StyleObject
  children: RemixNode
}

export function GameScreen() {
  return (props: GameScreenProps) => {
    const { id, className, labelledBy, padded = false, as = 'section', screenStyles, children } = props
    const Tag = as
    const mixins = [css(gameScreenBaseStyles)]

    if (padded) {
      mixins.push(css(paddedGameScreenStyles))
    }

    if (screenStyles) {
      mixins.push(css(screenStyles))
    }

    return (
      <Tag id={id} className={['screen', className].filter(Boolean).join(' ')} aria-labelledby={labelledBy} mix={mixins}>
        {children}
      </Tag>
    )
  }
}

interface GameSettingsModalProps {
  title: string
  headingId?: string
  headingClassName?: string
  contentClassName?: string
  overlayStyles?: StyleObject
  children: RemixNode
}

export function GameSettingsModal() {
  return (props: GameSettingsModalProps) => {
    const {
      title,
      headingId = 'settings-heading',
      headingClassName,
      contentClassName = 'settings-content',
      overlayStyles,
      children,
    } = props

    const mixins = [css(settingsModalBaseStyles)]
    if (overlayStyles) {
      mixins.push(css(overlayStyles))
    }

    return (
      <div id="settings-modal" className="settings-modal" role="dialog" aria-modal="true" aria-labelledby={headingId} tabIndex={-1} hidden mix={mixins}>
        <div className={contentClassName}>
          <h2 id={headingId} className={headingClassName}>{title}</h2>
          {children}
        </div>
      </div>
    )
  }
}

interface SrOnlyProps {
  as?: SrOnlyElement
  id?: string
  className?: string
  ariaLive?: 'polite' | 'assertive'
  ariaAtomic?: boolean
  children?: RemixNode
}

export function SrOnly() {
  return (props: SrOnlyProps) => {
    const { as = 'div', id, className = 'sr-only', ariaLive, ariaAtomic = false, children } = props
    const Tag = as

    return (
      <Tag
        id={id}
        className={className}
        aria-live={ariaLive}
        aria-atomic={ariaAtomic ? 'true' : undefined}
        mix={[css(srOnlyStyles)]}
      >
        {children}
      </Tag>
    )
  }
}

const gameHeaderSlotStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 'clamp(0.3rem, 1vw, 0.6rem)',
  flexShrink: 1,
  minWidth: 0,
  flexWrap: 'wrap',
}

interface GameHeaderProps {
  leftContent: RemixNode
  rightContent: RemixNode
  className?: string
  headingId?: string
}

export function GameHeader() {
  return (props: GameHeaderProps) => {
    const { leftContent, rightContent, className, headingId } = props
    return (
      <header
        className={className}
        aria-labelledby={headingId}
        mix={[css(gameHeaderStyles)]}
      >
        <div mix={[css(gameHeaderSlotStyles)]}>{leftContent}</div>
        <div mix={[css(gameHeaderSlotStyles)]}>{rightContent}</div>
      </header>
    )
  }
}

interface GameHeaderPillProps {
  icon?: RemixNode
  label?: string
  value: RemixNode
  className?: string
}

export function GameHeaderPill() {
  return (props: GameHeaderPillProps) => {
    const { icon, label, value, className } = props
    return (
      <span className={className} mix={[css(gameHeaderPillStyles)]}>
        {label ? <span mix={[css(srOnlyStyles)]}>{label}: </span> : null}
        {icon ? <span aria-hidden="true">{icon}</span> : null}
        <span>{value}</span>
      </span>
    )
  }
}

interface SettingsSectionProps {
  title: string
  children: RemixNode
}

export function SettingsSection() {
  return (props: SettingsSectionProps) => {
    const { title, children } = props
    return (
      <section className="settings-section" mix={[css(settingsSectionStyles)]}>
        <h3 className="settings-section-title">{title}</h3>
        {children}
      </section>
    )
  }
}

interface SettingsToggleProps {
  id: string
  label: string
  helpText?: string
  helpId?: string
  defaultChecked?: boolean
}

export function SettingsToggle() {
  return (props: SettingsToggleProps) => {
    const { id, label, helpText, helpId, defaultChecked } = props
    return (
      <div className="settings-toggle-group">
        <label className="settings-toggle-row" htmlFor={id} mix={[css(settingsToggleStyles)]}>
          <span>{label}</span>
          <input type="checkbox" id={id} checked={defaultChecked} aria-describedby={helpId} />
        </label>
        {helpText ? <p id={helpId} className="settings-help">{helpText}</p> : null}
      </div>
    )
  }
}

interface SettingsActionsProps {
  quitHref: string
  showRestart?: boolean
  quitClassName?: string
}

export function SettingsActions() {
  return (props: SettingsActionsProps) => {
    const { quitHref, showRestart = true, quitClassName } = props
    return (
      <div className="settings-actions" mix={[css(settingsActionsStyles)]}>
        {showRestart ? (
          <button id="restart-btn" type="button" className="settings-restart-btn">Restart</button>
        ) : null}
        <a href={quitHref} className={['settings-quit-link', quitClassName].filter(Boolean).join(' ')}>Quit</a>
        <button id="settings-close-btn" type="button" className="settings-close-btn">Close</button>
      </div>
    )
  }
}