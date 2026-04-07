import { css } from '@remix-run/component'

interface GameCardProps {
  slug: string
  name: string
  description: string
  icon: string
  gamePath: string
  attributionPath: string
}

interface ComingSoonGameCardProps {
  name: string
  description: string
  icon: string
}

const cardFocusRingStyles = {
  outline: '3px solid color-mix(in srgb, var(--color-accent) 55%, #fff)',
  outlineOffset: '3px',
}

const cardRaisedStyles = {
  transform: 'translateY(-2px)',
  boxShadow: 'var(--shadow-card-hover)',
}

const gameCardBaseStyles = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 'var(--space-md)',
  background: 'var(--color-surface)',
  padding: 'var(--space-md)',
  borderRadius: '12px',
  transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
  color: 'inherit',
  alignItems: 'stretch',
  '[data-reduce-motion="reduce"] &': {
    transition: 'none',
  },
  '@media (prefers-reduced-motion: reduce)': {
    ':root:not([data-reduce-motion="no-preference"]) &': {
      transition: 'none',
    },
  },
}

const gameCardStyles = {
  ...gameCardBaseStyles,
  '&:hover': cardRaisedStyles,
  '&:focus-within': cardRaisedStyles,
}

const gameCardBodyStyles = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-md)',
  minWidth: 0,
  padding: 'var(--space-lg)',
  borderRadius: '10px',
  '@media (max-width: 560px)': {
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
  },
}

const gameCardPrimaryStyles = {
  ...gameCardBodyStyles,
  textDecoration: 'none',
  color: 'inherit',
  transition: 'background-color 0.2s ease-out',
  '&:hover': {
    color: 'inherit',
    background: 'color-mix(in srgb, var(--color-accent) 6%, transparent)',
  },
  '&:focus-visible': cardFocusRingStyles,
  '&.gamepad-focus': cardFocusRingStyles,
}

const gameCardCopyStyles = {
  flex: '1 1 auto',
  minWidth: 0,
  '& h2': {
    fontSize: 'var(--text-lg)',
    color: 'var(--color-text)',
  },
  '& p': {
    color: 'var(--color-muted)',
    marginTop: 'var(--space-xs)',
  },
}

const gameCardIconStyles = {
  fontSize: '2rem',
  flex: '0 0 auto',
}

const gameCardInfoButtonStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100%',
  minWidth: '2.4rem',
  padding: 'var(--space-sm) 0.2rem',
  borderRadius: '10px',
  textDecoration: 'none',
  fontWeight: 700,
  border: '1px solid color-mix(in srgb, var(--color-accent) 38%, transparent)',
  color: 'var(--color-text)',
  alignSelf: 'stretch',
  justifySelf: 'stretch',
  fontSize: '0.68rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  overflow: 'hidden',
  '&:hover': {
    color: 'var(--color-accent)',
  },
  '&:focus-visible': cardFocusRingStyles,
  '@media (max-width: 560px)': {
    minWidth: '2rem',
  },
}

const gameCardInfoTextStyles = {
  display: 'inline-block',
  transform: 'rotate(90deg)',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  '@media (max-width: 560px)': {
    fontSize: '0.6rem',
    letterSpacing: '0.12em',
  },
}

const comingSoonCardStyles = {
  ...gameCardBaseStyles,
  opacity: 0.7,
  cursor: 'default',
  position: 'relative',
  gridTemplateColumns: 'minmax(0, 1fr)',
  '&:hover': {
    transform: 'none',
    boxShadow: 'none',
  },
}

const comingSoonBadgeStyles = {
  display: 'inline-block',
  marginTop: 'var(--space-sm)',
  marginLeft: 'var(--space-lg)',
  padding: 'var(--space-xs) var(--space-sm)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--color-accent)',
  border: '1px solid var(--color-accent-light)',
  borderRadius: '4px',
}

export function GameCard() {
  return ({ slug, name, description, icon, gamePath, attributionPath }: GameCardProps) => (
    <article className="game-card" data-game-card={slug} mix={[css(gameCardStyles)]}>
      <a href={gamePath} className="game-card-primary" aria-label={`Open ${name}`} mix={[css(gameCardPrimaryStyles)]}>
        <span className="game-card-icon" aria-hidden="true" mix={[css(gameCardIconStyles)]}>{icon}</span>
        <div className="game-card-copy" mix={[css(gameCardCopyStyles)]}>
          <h2>{name}</h2>
          <p>{description}</p>
        </div>
      </a>
      <a href={attributionPath} className="game-card-info-btn" aria-label={`View info for ${name}`} title={`Info for ${name}`} mix={[css(gameCardInfoButtonStyles)]}>
        <span className="game-card-info-text" mix={[css(gameCardInfoTextStyles)]}>INFO</span>
      </a>
    </article>
  )
}

export function ComingSoonGameCard() {
  return ({ name, description, icon }: ComingSoonGameCardProps) => (
    <article className="game-card game-card-coming-soon" mix={[css(comingSoonCardStyles)]}>
      <div className="game-card-body" mix={[css(gameCardBodyStyles)]}>
        <span className="game-card-icon" aria-hidden="true" mix={[css(gameCardIconStyles)]}>{icon}</span>
        <div className="game-card-copy" mix={[css(gameCardCopyStyles)]}>
          <h2>{name}</h2>
          <p>{description}</p>
        </div>
      </div>
      <span className="coming-soon-badge" mix={[css(comingSoonBadgeStyles)]}>Coming Soon</span>
    </article>
  )
}