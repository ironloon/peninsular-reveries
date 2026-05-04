// Re-export state logic from original beat-pad game
export { createInitialState, triggerPad, startRecording, stopRecording, togglePlayback, clearLoop, cycleTempo } from '../beat-pad/state.js'
export type { BeatPadState, BeatPadMode, BeatPadBankId, PadId, TempoPreset } from '../beat-pad/types.js'