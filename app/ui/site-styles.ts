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

export const gameHeaderStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'clamp(0.3rem, 1vw, 0.6rem)',
  alignItems: 'center',
  justifyContent: 'space-between',
  '& > *': {
    flexShrink: 1,
    minWidth: 0,
  },
  '@media (max-width: 420px)': {
    gap: '0.2rem 0.3rem',
  },
}

export const gameHeaderPillStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  fontSize: '0.78rem',
  lineHeight: 1.2,
  padding: '0.18rem 0.5rem',
  borderRadius: '9999px',
  background: 'rgba(255, 255, 255, 0.07)',
  minWidth: 0,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '@media (max-width: 420px)': {
    fontSize: '0.7rem',
    padding: '0.14rem 0.38rem',
  },
}

export const settingsSectionStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

export const settingsToggleStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
  flexWrap: 'wrap',
  minWidth: 0,
  cursor: 'pointer',
  '@media (max-width: 420px)': {
    gap: '0.25rem',
  },
}

export const settingsActionsStyles = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
  alignItems: 'center',
  '@media (max-width: 420px)': {
    flexDirection: 'column',
    alignItems: 'stretch' as const,
    gap: '0.4rem',
  },
}

export const tabBarStyles = {
  display: 'flex',
  flexDirection: 'row',
  borderBottom: '2px solid var(--modal-accent, var(--color-accent, #7ec8e3))',
  marginBottom: '0.5rem',
  gap: '0.25rem',
}

export const tabButtonStyles = {
  background: 'none',
  border: 'none',
  padding: '0.5rem 1rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  color: 'var(--modal-text, var(--color-text, inherit))',
  cursor: 'pointer',
  borderRadius: '6px 6px 0 0',
  minWidth: '44px',
  minHeight: '44px',
  position: 'relative',
  '&.tab-btn--active': {
    color: 'var(--modal-accent, var(--color-accent, #7ec8e3))',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: '-2px',
      left: 0,
      right: 0,
      height: '3px',
      background: 'var(--modal-accent, var(--color-accent, #7ec8e3))',
      borderRadius: '2px 2px 0 0',
    },
  },
  '&:hover': {
    background: 'rgba(255,255,255,0.08)',
  },
  '&:focus-visible': {
    outline: '3px solid var(--modal-accent, var(--color-accent, #7ec8e3))',
    outlineOffset: '2px',
  },
}

export const tabPanelStyles = {
  overflowY: 'auto',
  maxHeight: 'clamp(200px, 55dvh, 420px)',
  paddingRight: '0.25rem',
}

export const modalCloseStyles = {
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  width: '44px',
  height: '44px',
  minWidth: '44px',
  minHeight: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.08)',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1.4rem',
  cursor: 'pointer',
  color: 'var(--modal-text, var(--color-text, inherit))',
  lineHeight: 1,
  '&:hover': {
    background: 'rgba(255,255,255,0.18)',
  },
  '&:focus-visible': {
    outline: '3px solid var(--modal-accent, var(--color-accent, #7ec8e3))',
    outlineOffset: '2px',
  },
}

export const infoSectionStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  padding: '0.5rem 0',
  '& h3': {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--modal-accent, var(--color-accent, inherit))',
    margin: 0,
  },
  '& p, & ul, & ol': {
    fontSize: '0.85rem',
    color: 'var(--modal-text, var(--color-text, inherit))',
    margin: 0,
  },
}