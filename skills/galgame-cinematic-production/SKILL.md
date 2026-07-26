---
name: galgame-cinematic-production
description: Build or extend a Galgame/visual-novel cinematic in Godot and Blender. Use for cutscenes, character pursuit or confrontation sequences, scene direction, reusable 3D assets, standalone cinematic launchers, or visual QA for game cinematics.
---

# Galgame Cinematic Production

Create an independently runnable cinematic slice without replacing the game's main flow.

## Workflow

1. Inspect the current scene, asset licences, launch flow, and dirty Blender state. Back up an unsaved `.blend` before changing it.
2. Write a beat sheet: pressure, response, escalation, impact, and recovery. Attach each beat to a camera purpose and a visible state.
3. Reuse approved assets before modelling new ones. Keep source and exported `.glb`/`.gltf` versioned beside the game assets.
4. Add a dedicated Godot scene and launcher. Preserve the original entrypoint and include an explicit return path.
5. Add dynamic Godot nodes to the tree before assigning global transforms. For mesh fades, use a transparent material rather than tweening `MeshInstance3D.modulate:a`.
6. Run headless validation, then visually inspect framing, impact readability, pacing, and final composition. Headless success alone is not acceptance.

## Delivery contract

- State the entry scene, launcher command, changed assets, and rollback point.
- Do not add audio unless requested.
- Preserve source `.blend` files and exported runtime assets; never overwrite the user's working scene.
- Keep dialogue, shot timings, and director constants in a discoverable controller script.

For Blender/Godot handoff details, read [references/blender-godot.md](references/blender-godot.md).
