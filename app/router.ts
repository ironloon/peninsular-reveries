import { createRouter } from '@remix-run/fetch-router'
import { routes } from './routes.js'
import { attributionsAction } from './controllers/attributions.js'
import { gameInfoAction } from './controllers/game-info.js'
import { homeAction } from './controllers/home.js'
import { notFoundAction } from './controllers/not-found.js'
import { chompersAction } from '../games/chompers/controller.js'
import { missionOrbitAction } from '../games/mission-orbit/controller.js'
import { pixelPassportAction } from '../games/pixel-passport/controller.js'
import { squaresAction } from '../games/squares/controller.js'
import { superWordAction } from '../games/super-word/controller.js'
import { storyTrailAction } from '../games/story-trail/controller.js'

export function createAppRouter() {
  const router = createRouter()

  router.get(routes.home, () => homeAction())
  router.get(routes.attributions, () => attributionsAction())
  router.get(routes.superWordInfo, () => gameInfoAction('super-word'))
  router.get(routes.missionOrbitInfo, () => gameInfoAction('mission-orbit'))
  router.get(routes.chompersInfo, () => gameInfoAction('chompers'))
  router.get(routes.pixelPassportInfo, () => gameInfoAction('pixel-passport'))
  router.get(routes.storyTrailInfo, () => gameInfoAction('story-trail'))
  router.get(routes.squaresInfo, () => gameInfoAction('squares'))
  router.get(routes.missionOrbit, () => missionOrbitAction())
  router.get(routes.superWord, () => superWordAction())
  router.get(routes.chompers, () => chompersAction())
  router.get(routes.pixelPassport, () => pixelPassportAction())
  router.get(routes.storyTrail, () => storyTrailAction())
  router.get(routes.squares, () => squaresAction())
  router.get(routes.notFound, () => notFoundAction())

  return router
}
