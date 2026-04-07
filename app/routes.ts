import { route } from '@remix-run/fetch-router/routes'
import { attributionsPagePath } from './data/attributions/index.js'

export const routes = route({
  home: '/',
  attributions: attributionsPagePath,
  superWordInfo: '/super-word/info/',
  missionOrbitInfo: '/mission-orbit/info/',
  chompersInfo: '/chompers/info/',
  pixelPassportInfo: '/pixel-passport/info/',
  missionOrbit: '/mission-orbit/',
  superWord: '/super-word/',
  chompers: '/chompers/',
  pixelPassport: '/pixel-passport/',
  notFound: '/404.html',
})
