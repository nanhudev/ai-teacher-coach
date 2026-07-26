# Blender to Godot handoff

- Back up a dirty `.blend` before changing it.
- Apply location, rotation, and scale before exporting a versioned `.glb`.
- Use metres consistently; confirm imported scale, materials, collision, and normals in Godot.
- In background Blender 5.x work, use `BLENDER_EEVEE` and create a World explicitly after factory settings.
- Add Godot nodes to the tree before setting `global_position` or `global_transform`.
- Verify headless execution, then play the prototype; headless success does not verify movement or camera feel.
