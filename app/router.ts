import { createRouter } from '@remix-run/fetch-router'
import { routes } from './routes.js'
import { attributionsAction } from './controllers/attributions.js'
import { gameInfoAction } from './controllers/game-info.js'
import { homeAction } from './controllers/home.js'
import { notFoundAction } from './controllers/not-found.js'
import { chompersAction } from '../games/chompers/controller.js'
import { beatPadAction } from '../games/beat-pad/controller.js'
import { missionOrbitAction } from '../games/mission-orbit/controller.js'
import { pixelPassportAction } from '../games/pixel-passport/controller.js'
import { squaresAction } from '../games/squares/controller.js'
import { superWordAction } from '../games/super-word/controller.js'
import { storyTrailAction } from '../games/story-trail/controller.js'
import { trainSoundsAction } from '../games/train-sounds/controller.js'
import { waterwallAction } from '../games/waterwall/controller.js'
import { spotOnAction } from '../games/spot-on/controller.js'
import { peekabooAction } from '../games/peekaboo/controller.js'
import { copycatAction } from '../games/copycat/controller.js'
import { dragonsCrunchAction } from '../games/dragons-crunch/controller.js'
import { mudskipperAction } from '../games/mudskipper/controller.js'
import { tunaPianoAction } from '../games/tuna-piano/controller.js'
import { growWithMeAction } from '../games/grow-with-me/controller.js'
import { bakingSimulatorAction } from '../games/baking-simulator/controller.js'
import { allAboardAction } from '../games/all-aboard/controller.js'
import { blockAttackAction } from '../games/block-attack/controller.js'

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
  router.get(routes.waterwallInfo, () => gameInfoAction('waterwall'))
  router.get(routes.beatPadInfo, () => gameInfoAction('beat-pad'))
  router.get(routes.trainSoundsInfo, () => gameInfoAction('train-sounds'))
  router.get(routes.spotOnInfo, () => gameInfoAction('spot-on'))
  router.get(routes.peekabooInfo, () => gameInfoAction('peekaboo'))
  router.get(routes.copycatInfo, () => gameInfoAction('copycat'))
  router.get(routes.dragonsCrunchInfo, () => gameInfoAction('dragons-crunch'))
  router.get(routes.mudskipperInfo, () => gameInfoAction('mudskipper'))
  router.get(routes.tunaPianoInfo, () => gameInfoAction('tuna-piano'))
  router.get(routes.growWithMeInfo, () => gameInfoAction('grow-with-me'))
  router.get(routes.bakingSimulatorInfo, () => gameInfoAction('baking-simulator'))
  router.get(routes.missionOrbit, () => missionOrbitAction())
  router.get(routes.superWord, () => superWordAction())
  router.get(routes.chompers, () => chompersAction())
  router.get(routes.pixelPassport, () => pixelPassportAction())
  router.get(routes.storyTrail, () => storyTrailAction())
  router.get(routes.squares, () => squaresAction())
  router.get(routes.waterwall, () => waterwallAction())
  router.get(routes.beatPad, () => beatPadAction())
  router.get(routes.trainSounds, () => trainSoundsAction())
  router.get(routes.spotOn, () => spotOnAction())
  router.get(routes.peekaboo, () => peekabooAction())
  router.get(routes.copycat, () => copycatAction())
  router.get(routes.dragonsCrunch, () => dragonsCrunchAction())
  router.get(routes.mudskipper, () => mudskipperAction())
  router.get(routes.tunaPiano, () => tunaPianoAction())
  router.get(routes.growWithMe, () => growWithMeAction())
  router.get(routes.bakingSimulator, () => bakingSimulatorAction())
  router.get(routes.allAboard, () => allAboardAction())
  router.get(routes.allAboardInfo, () => gameInfoAction('all-aboard'))
  router.get(routes.blockAttack, () => blockAttackAction())
  router.get(routes.blockAttackInfo, () => gameInfoAction('block-attack'))
  router.get(routes.notFound, () => notFoundAction())

  return router
}