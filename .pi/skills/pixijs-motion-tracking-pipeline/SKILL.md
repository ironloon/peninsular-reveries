---
name: pixijs-motion-tracking-pipeline
description: "Implement stable, noise-resistant real-time motion tracking and pose detection for PixiJS using structured pipelines. Supports both multi-body tracking and single-body pose classification."
user-invocable: true
model-invocation: true
input-type: code-and-natural-language
output-type: code
tags: ["motion", "mocap", "pixi", "game-dev", "computer-vision"]
version: 1.0
---

# Skill: pixi-motion-tracking-pipeline

## Purpose
Implement or refactor motion tracking and pose detection systems for webcam/video input in PixiJS games.

This skill prioritizes:
- temporal stability (low jitter)
- consistent behavior across frames
- strong noise rejection
- clean architectural separation

---

## Output Contract
- Return ONLY valid TypeScript code
- No prose or explanations unless explicitly requested
- Preserve existing public API unless told otherwise
- Do NOT introduce external dependencies unless requested

---

## Core Principle (CRITICAL)

Motion processing is a TEMPORAL SIGNAL problem, not a per-frame problem.

All logic MUST preserve stability across time, not just correctness per frame.

---

## System Modes (IMPORTANT)

### Mode A: Multi-Body Tracking

Use when:
- tracking multiple people or objects
- maintaining persistent identities
- working with blobs or regions

Required pipeline:

detectBodies → mergeBlobs → trackBodies → buildMotionBodies

---

### Mode B: Single-Body Pose Classification

Use when:
- tracking one player
- computing a single centroid/spread
- mapping motion directly to poses

Required pipeline:

detectMotion → computeMetrics → smoothMetrics → resolvePose → stabilizePose

Rules:
- DO NOT introduce IDs or multi-body tracking
- DO NOT introduce blob merging unless explicitly required
- Treat motion as a single continuous signal

---

## Core Rules

### Temporal Stability (REQUIRED)
- All motion signals MUST be smoothed over time
- Sudden spikes MUST be dampened
- Outputs MUST not jitter frame-to-frame

### Time-Based Logic (CRITICAL)
- Use timestamps, NOT frame counts
- All stabilization MUST be time-based (ms), not frame-based
- Systems MUST behave consistently across varying FPS

### Spatial Validity
- Reject clearly invalid motion (too small, too noisy, extreme ratios)
- Avoid unstable edge-triggered thresholds

### Architecture
- No hidden global state inside helper functions
- width/height MUST be passed explicitly where used
- Pure functions MUST remain pure

---

## Required Patterns (MANDATORY)

### Smoothing (REQUIRED)

All motion inputs MUST be smoothed BEFORE classification or tracking:

const SMOOTH = 0.6
value = prev * SMOOTH + next * (1 - SMOOTH)

Applies to:
- centroid positions
- spreads
- derived motion signals

---

### Stabilization (REQUIRED)

Outputs MUST be time-stabilized:

const HOLD_TIME = 100

if (next !== pending) {
  pending = next
  since = now
} else if (next !== current && now - since > HOLD_TIME) {
  current = next
}

---

### Persistence (Multi-Body Only)

- Use lastSeen timestamps
- Keep bodies alive for PERSISTENCE_TIMEOUT
- Remove ONLY after timeout exceeded

---

### Identity Matching (Multi-Body Only)

- Use nearest-neighbor matching
- Use squared distance thresholds
- Prevent duplicate assignment

---

## Anti-Patterns (FORBIDDEN)

- Frame-perfect logic without temporal buffering
- Unsmoothened motion inputs
- Flickering outputs
- Combining multiple pipeline stages into one
- Reassigning identities every frame
- Using global width/height inside helpers
- Overfitting thresholds to single-frame noise

---

## Common Bugs to Check

- Missing smoothing → jitter
- Pose flickering due to no hold time
- Using frame count instead of timestamps
- Ignoring pendingSince / stabilization timing
- Sudden spikes causing false triggers
- Hidden global state causing inconsistent behavior

---

## Implementation Constraints

- Prefer clarity over micro-optimizations
- Keep stages small and composable
- Maintain strict pipeline boundaries
- Extend pipelines instead of collapsing them

---

## Output Expectations

### Multi-Body:
- Stable IDs across frames
- Smooth motion
- No flicker
- Robust to noise

### Single-Body:
- Smooth input signals
- Stable pose transitions
- No rapid flickering
- Consistent behavior across frame rates

---

## Quality Checklist

- Is the correct mode (single vs multi-body) being used?
- Are inputs smoothed before use?
- Is output stabilized with time-based logic?
- Are transitions free of flicker?
- Is the pipeline clearly separated?
- Is behavior consistent across FPS variations?

If any answer is no, refine before output.
