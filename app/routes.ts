import { route } from 'remix/fetch-router/routes'
import { attributionsPagePath } from './data/attributions.js'

export const routes = route({
  home: '/',
  attributions: attributionsPagePath,
  superWord: '/super-word/',
  notFound: '/404.html',
})
