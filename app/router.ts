import { createRouter } from '@remix-run/fetch-router'
import { routes } from './routes.js'
import { attributionsAction } from './controllers/attributions.js'
import { chompersAction } from './controllers/chompers.js'
import { homeAction } from './controllers/home.js'
import { missionOrbitAction } from './controllers/mission-orbit.js'
import { notFoundAction } from './controllers/not-found.js'
import { pixelPassportAction } from './controllers/pixel-passport.js'
import { superWordAction } from './controllers/super-word.js'

export function createAppRouter() {
  const router = createRouter()

  router.get(routes.home, () => homeAction())
  router.get(routes.attributions, () => attributionsAction())
  router.get(routes.missionOrbit, () => missionOrbitAction())
  router.get(routes.superWord, () => superWordAction())
  router.get(routes.chompers, () => chompersAction())
  router.get(routes.pixelPassport, () => pixelPassportAction())
  router.get(routes.notFound, () => notFoundAction())

  return router
}
