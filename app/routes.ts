import { route } from 'remix/fetch-router/routes'
import { attributionsPagePath } from './data/attributions.js'

export const routes = route({
  home: '/',
  attributions: attributionsPagePath,
  missionOrbit: '/mission-orbit/',
  superWord: '/super-word/',
  chompers: '/chompers/',
  pixelPassport: '/pixel-passport/',
  notFound: '/404.html',
})
