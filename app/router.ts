import { createRouter } from 'remix/fetch-router'
import { routes } from './routes.js'
import { attributionsAction } from './controllers/attributions.js'
import { homeAction } from './controllers/home.js'
import { notFoundAction } from './controllers/not-found.js'
import { superWordAction } from './controllers/super-word.js'

export function createAppRouter() {
  const router = createRouter()

  router.get(routes.home, () => homeAction())
  router.get(routes.attributions, () => attributionsAction())
  router.get(routes.superWord, () => superWordAction())
  router.get(routes.notFound, () => notFoundAction())

  return router
}
