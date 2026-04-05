export const siteHeaderStyles = {
  background: 'var(--color-surface)',
  padding: 'var(--space-sm) var(--space-md)',
  viewTransitionName: 'site-header',
}

export const siteMainStyles = {
  maxWidth: '42rem',
  marginInline: 'auto',
  padding: 'var(--space-xl) var(--space-lg) var(--space-2xl)',
  viewTransitionName: 'main-content',
}

export const siteFooterStyles = {
  textAlign: 'center',
  padding: 'var(--space-2xl) var(--space-lg)',
  color: 'var(--color-muted)',
  fontSize: 'var(--text-sm)',
}

export const pageStackStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-xl)',
}

export const pageHeroStyles = {
  padding: 'var(--space-2xl) 0 var(--space-sm)',
  '& h1': {
    fontSize: 'var(--text-xl)',
  },
  '& p': {
    color: 'var(--color-muted)',
    marginTop: 'var(--space-sm)',
  },
}

export const pageHomeLinkStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '2.75rem',
  minWidth: '2.75rem',
  width: 'fit-content',
  marginBottom: 'var(--space-md)',
  padding: '0.7rem',
  borderRadius: '999px',
  textDecoration: 'none',
  fontWeight: 700,
  border: '1px solid color-mix(in srgb, var(--color-accent) 38%, transparent)',
  color: 'var(--color-text)',
  alignSelf: 'center',
  justifySelf: 'center',
  fontSize: '0.95rem',
  '&:hover': {
    color: 'var(--color-accent)',
  },
  '&:focus-visible': {
    outline: '3px solid color-mix(in srgb, var(--color-accent) 55%, #fff)',
    outlineOffset: '3px',
  },
}

export const sectionCardStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-sm)',
  background: 'var(--color-surface)',
  borderRadius: '10px',
  padding: 'var(--space-lg)',
}

export const sectionCardHeadingStyles = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 'var(--space-md)',
  flexWrap: 'wrap',
}

export const attributionSectionStyles = {
  scrollMarginTop: 'var(--space-xl)',
}

export const sectionMutedStyles = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-muted)',
}

export const sectionLabelStyles = {
  fontWeight: 700,
}

export const attributionListStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-sm)',
}

export const attributionItemStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-xs)',
  background: 'var(--color-bg)',
  borderRadius: '8px',
  padding: 'var(--space-md)',
}

export const fourOhFourStyles = {
  textAlign: 'center',
  padding: 'var(--space-3xl) 0 var(--space-2xl)',
}

export const fourOhFourDigitStyles = {
  display: 'inline-block',
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(4rem, 8vw, 8rem)',
  color: 'var(--color-accent)',
  animation: 'float 3s ease-in-out infinite',
  '[data-reduce-motion="reduce"] &': {
    animation: 'none',
  },
  '&:nth-child(2)': {
    animationDelay: '0.4s',
  },
  '&:nth-child(3)': {
    animationDelay: '0.8s',
  },
  '@media (prefers-reduced-motion: reduce)': {
    ':root:not([data-reduce-motion="no-preference"]) &': {
      animation: 'none',
    },
  },
  '@keyframes float': {
    '0%, 100%': {
      transform: 'translateY(0)',
    },
    '50%': {
      transform: 'translateY(-8px)',
    },
  },
}

export const fourOhFourTaglineStyles = {
  fontSize: 'var(--text-lg)',
  color: 'var(--color-muted)',
  marginTop: 'var(--space-lg)',
}

export const fourOhFourLinkStyles = {
  display: 'inline-block',
  marginTop: 'var(--space-lg)',
}