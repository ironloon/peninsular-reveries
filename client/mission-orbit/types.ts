export type ScenePhase = 'briefing' | 'cinematic' | 'interaction' | 'transition'

export type CinematicType =
  | 'launch-pad'
  | 'ascent'
  | 'orbit-insertion'
  | 'trans-lunar-injection'
  | 'lunar-approach'
  | 'lunar-flyby'
  | 'return'
  | 'reentry-splashdown'

export type InteractionType = 'tap-fast' | 'tap-single' | 'hold' | 'observe'

export interface MissionScene {
  id: CinematicType
  title: string
  cinematicType: CinematicType
  interactionType: InteractionType
  tapTarget?: number          // required for tap-fast (e.g. 20 taps)
  holdDurationMs?: number     // required for hold (e.g. 3000ms)
  crewMember: string          // e.g. "Wiseman"
  briefingText: string        // one short sentence, level-1 reading
  interactionPrompt: string   // e.g. "Tap as fast as you can!" "Hold to fire!"
}

export interface MissionState {
  sceneIndex: number            // 0..7
  scenePhase: ScenePhase
  tapCount: number              // for tap-fast interactions
  tapTarget: number             // required tap count for current scene
  holdProgress: number          // 0..1 for hold interactions
  holdActive: boolean           // is player currently holding?
  interactionComplete: boolean  // has this scene's interaction been completed?
  elapsedMs: number             // ms in current phase
  transitionMs: number          // ms in transition phase (0..800)
}

export const SCENES: MissionScene[] = [
  {
    id: 'launch-pad',
    title: 'Launch Pad',
    cinematicType: 'launch-pad',
    interactionType: 'tap-fast',
    tapTarget: 20,
    crewMember: 'Wiseman',
    briefingText: 'The rocket is ready for liftoff.',
    interactionPrompt: 'Tap as fast as you can to ignite the engines!',
  },
  {
    id: 'ascent',
    title: 'Ascent',
    cinematicType: 'ascent',
    interactionType: 'hold',
    holdDurationMs: 3000,
    crewMember: 'Glover',
    briefingText: 'The rocket climbs through the sky.',
    interactionPrompt: 'Hold to keep the engines burning!',
  },
  {
    id: 'orbit-insertion',
    title: 'Orbit Insertion',
    cinematicType: 'orbit-insertion',
    interactionType: 'tap-single',
    crewMember: 'Koch',
    briefingText: 'The crew reaches orbit around Earth.',
    interactionPrompt: 'Tap to fire the orbital insertion burn!',
  },
  {
    id: 'trans-lunar-injection',
    title: 'Trans-Lunar Injection',
    cinematicType: 'trans-lunar-injection',
    interactionType: 'hold',
    holdDurationMs: 4000,
    crewMember: 'Hansen',
    briefingText: 'A big burn sends the crew toward the Moon.',
    interactionPrompt: 'Hold to complete the trans-lunar injection burn!',
  },
  {
    id: 'lunar-approach',
    title: 'Lunar Approach',
    cinematicType: 'lunar-approach',
    interactionType: 'tap-single',
    crewMember: 'Koch',
    briefingText: 'The Moon grows larger in the window.',
    interactionPrompt: 'Tap to enter lunar orbit!',
  },
  {
    id: 'lunar-flyby',
    title: 'Lunar Flyby',
    cinematicType: 'lunar-flyby',
    interactionType: 'observe',
    crewMember: 'Wiseman',
    briefingText: 'The crew orbits the Moon and looks out the window.',
    interactionPrompt: 'Watch as the crew flies around the Moon.',
  },
  {
    id: 'return',
    title: 'Return to Earth',
    cinematicType: 'return',
    interactionType: 'tap-single',
    crewMember: 'Glover',
    briefingText: "It's time to head home.",
    interactionPrompt: 'Tap to start the return burn!',
  },
  {
    id: 'reentry-splashdown',
    title: 'Reentry & Splashdown',
    cinematicType: 'reentry-splashdown',
    interactionType: 'hold',
    holdDurationMs: 4000,
    crewMember: 'Hansen',
    briefingText: 'The capsule splashes down in the ocean.',
    interactionPrompt: "Hold as you reenter Earth's atmosphere!",
  },
]