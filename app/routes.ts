import { route } from '@remix-run/fetch-router/routes'
import { attributionsPagePath } from './data/attribution-index.js'

export const routes = route({
  home: '/',
  attributions: attributionsPagePath,
  superWordInfo: '/super-word/info/',
  missionOrbitInfo: '/mission-orbit/info/',
  chompersInfo: '/chompers/info/',
  pixelPassportInfo: '/pixel-passport/info/',
  storyTrailInfo: '/story-trail/info/',
  squaresInfo: '/squares/info/',
  missionOrbit: '/mission-orbit/',
  superWord: '/super-word/',
  chompers: '/chompers/',
  pixelPassport: '/pixel-passport/',
  storyTrail: '/story-trail/',
  squares: '/squares/',
  notFound: '/404.html',
})
