import { route } from 'remix/fetch-router/routes'

export const routes = route({
  home: '/',
  superWord: '/super-word/',
  notFound: '/404.html',
})
