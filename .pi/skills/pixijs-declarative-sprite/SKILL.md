---
name: pixi-declarative-sprite
description: "Generate structured 2D sprite models as declarative shape trees for PixiJS v8 rendering. Outputs a Model object (no imperative drawing code)."
user-invocable: true
model-invocation: true
input-type: natural-language
output-type: json
tags: ["graphics", "pixi", "2d", "procedural", "game-dev"]
---

# Skill: pixi-declarative-sprite

## Purpose
Generate structured, declarative 2D sprite models for PixiJS v8 that can be rendered using a separate runtime.  
This skill does NOT produce imperative drawing code. It outputs a data model describing shapes, hierarchy, and animation roles.

---

## When to Use
Use this skill when:
- Creating 2D game characters, props, or simple effects
- Targeting PixiJS v8 or WebGPU-friendly rendering
- You want consistent, reusable, and modifiable sprite definitions

Do NOT use this skill for:
- Photorealistic art
- 3D models or meshes
- Direct shader authoring

---

## Output Contract
Return ONLY a valid `Model` object. No prose, no comments.

---

## Schema

type Shape =
  | { kind: "circle"; x: number; y: number; r: number; fill: string }
  | { kind: "ellipse"; x: number; y: number; rx: number; ry: number; fill: string }
  | { kind: "rect"; x: number; y: number; w: number; h: number; fill: string }
  | { kind: "roundedRect"; x: number; y: number; w: number; h: number; r: number; fill: string }
  | { kind: "polygon"; points: number[]; fill: string }

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

## Rules

- Never output PixiJS APIs
- Use semantic part names
- Keep coordinates centered around (0,0)
- Prefer simple primitives
- Use palette keys (no inline hex in shapes)
- Keep output compact and valid

---

## Animation Roles

- blink
- wag
- idle_breath
- look
- step

---

## Style

- Stylized, readable, game-ready
- Slight exaggeration encouraged
- Avoid unnecessary detail

---

## Version
v1.0
