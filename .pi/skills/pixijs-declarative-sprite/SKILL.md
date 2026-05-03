---
name: pixijs-declarative-sprite
description: "Generate high-quality stylized 2D sprite models as declarative shape trees for PixiJS v8 rendering. Outputs a Model object (no imperative drawing code)."
user-invocable: true
model-invocation: true
input-type: natural-language
output-type: json
tags: ["graphics", "pixi", "2d", "procedural", "game-dev"]
---

# Skill: pixi-declarative-sprite

## Purpose
Generate visually appealing, stylized 2D sprite models using a declarative structure.  
Output is optimized for PixiJS v8 rendering and WebGPU-friendly pipelines.

This skill prioritizes:
- clean silhouettes
- appealing proportions
- simple but effective shading

---

## Output Contract
Return ONLY a valid `Model` object.  
No prose, no comments, no explanations.

---

## Schema

type Shape =
  | { kind: "circle"; x: number; y: number; r: number; fill: string; alpha?: number }
  | { kind: "ellipse"; x: number; y: number; rx: number; ry: number; fill: string; alpha?: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; fill: string; alpha?: number }
  | { kind: "roundedRect"; x: number; y: number; w: number; h: number; r: number; fill: string; alpha?: number }
  | { kind: "polygon"; points: number[]; fill: string; alpha?: number }

type Part = {
  name: string
  role?: string
  offset?: [number, number]
  shapes?: Shape[]
  children?: Part[]
}

type Model = {
  name: string
  palette: Record<string, string>
  root: Part
}

---

## Core Rules

- Never output PixiJS APIs
- Use semantic part names (head, body, tail, etc.)
- Keep coordinates centered around (0,0)
- Prefer simple primitives over complex polygons
- Use palette keys (no inline hex in shapes)
- Keep output compact and valid

---

## Style Rules (CRITICAL)

### Silhouette
- The character must have a clear, readable silhouette
- Avoid jagged or noisy outlines
- Prefer smooth, rounded forms

### Proportions
- Head should be 40–60% of body size for stylized/cute designs
- Limbs should be thinner than the body
- Eyes should be slightly exaggerated for readability

### Shape Usage
- Use circles/ellipses for organic forms (body, head, paws)
- Use polygons only for sharp features (ears, tails, beaks)
- Avoid overly complex polygons

---

## Shading Rules (REQUIRED)

Every major part (body, head) should include simple shading:

- Use at least one shadow or highlight shape
- Shadow:
  - slightly offset
  - darker color (palette key: "shadow")
  - can use alpha (0.2–0.4)
- Highlight:
  - small and subtle
  - placed on upper area
  - palette key: "highlight"

---

## Color Palette

Use named keys only:

- base
- belly
- accent
- eye
- pupil
- shadow
- highlight

Example:

palette: {
  base: "#1a1a1a",
  belly: "#2d2d2d",
  accent: "#ff9999",
  eye: "#ffffff",
  pupil: "#000000",
  shadow: "#000000",
  highlight: "#ffffff"
}

---

## Animation Roles

Use `role` when appropriate:

- blink → eyes
- wag → tail
- idle_breath → body
- look → head
- step → legs

---

## Composition Guidelines

- Build characters from layered parts (body → head → details)
- Use child parts for structure, not z-index hacks
- Keep designs readable at small sizes (32–64px)

---

## Quality Checklist (apply before output)

- Is the silhouette clean and readable?
- Are proportions appealing and consistent?
- Are shapes simple and intentional?
- Is there at least basic shading?
- Does it look like a cohesive character?

If not, refine before output.

---

## Version
v2.0
