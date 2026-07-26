# Blender to Godot handoff

- Save or copy a dirty Blender scene before modification.
- Export a versioned `.glb` and confirm object, triangle, and material counts after import.
- Give the cinematic a separate Godot scene plus a launcher; the return action must restore the original flow.
- In background Blender 5.x work, set `BLENDER_EEVEE`; after factory settings, create and assign a World explicitly.
- Add dynamically spawned Godot nodes before setting `global_position` or `global_transform`.
- Verify headless execution and then inspect a playback pass for camera hierarchy, timing, impact readability, and final pose.
