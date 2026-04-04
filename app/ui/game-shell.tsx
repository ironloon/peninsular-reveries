import { css, type RemixNode } from 'remix/component'

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