---
name: godot-blender-third-person-starter
description: Create a starter third-person 3D game with Godot and Blender. Use for a basic playable character, smooth camera follow and look, acceleration, deceleration, character turning, Blender asset import, or a reusable Godot 4 third-person prototype.
---

# Godot + Blender Third-Person Starter

Build a runnable baseline, not a design document. Start from the bundled controller and adapt it only after its default movement, camera, and ground collision work.

## Required deliverable

- A Godot 4 project with `CharacterBody3D`, collision, a visible player mesh, `Pivot/SpringArm3D/Camera3D`, floor, and an explicit main scene.
- The bundled `assets/ThirdPersonController.gd.txt` attached to the player.
- A Blender source asset and a versioned `.glb` import, with scale, materials, and collision checked in Godot.
- A short run instruction and a headless validation command.

## Baseline build order

1. Create the player node hierarchy stated in the controller header; configure `player` and `camera` input actions.
2. Add a floor collider before tuning movement. Keep gravity and jump values in the controller exports.
3. Use the exposed acceleration, deceleration, turn, camera position smoothing, and camera rotation smoothing values. Do not replace them with direct transform assignment.
4. In Blender, apply transforms, set metres consistently, export `.glb`, and verify the imported mesh's scale and materials before adding gameplay complexity.
5. Add dynamic Godot nodes to the tree before setting global transforms. Use material transparency for mesh fades.
6. Run headless, then play the scene and inspect input feel: start/stop response, diagonal speed, turn lag, camera collision, and jump landing.

## Default smoothing contract

- Movement velocity uses `move_toward` with separate acceleration and deceleration.
- Character yaw uses `lerp_angle`.
- Camera pivot uses smoothed mouse targets, and SpringArm3D handles wall collision.
- Keep the defaults configurable in the Inspector; never hide tuning constants inside one-off scene code.

Read [references/blender-godot.md](references/blender-godot.md) before exporting assets or running background Blender automation.
