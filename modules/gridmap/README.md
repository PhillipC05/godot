# modules/gridmap/

3D tile-based level building: place instances of a `MeshLibrary`'s meshes
on a uniform grid, with automatic collision and navigation mesh generation
per cell. Disabled when 3D is disabled (`can_build` returns
`not env["disable_3d"]`).

## Classes

- `grid_map.h` / `.cpp` — `GridMap`, a `Node3D`. Cells are keyed by a
  packed `IndexKey` (three `int16_t` grid coordinates in one `uint64_t`)
  mapping to a `MeshLibrary` item ID plus orientation. Handles baking
  per-cell `MultiMesh`/`RenderingServer` instances (batched for
  performance rather than one `MeshInstance3D` node per cell), per-cell
  physics bodies (guarded by `PHYSICS_3D_DISABLED`), and navigation mesh
  regions sourced from each library item's collision/navigation shapes.
  `DebugVisibilityMode` controls whether GridMap-baked navigation/collision
  debug shapes show regardless of the global debug setting.

## Notes

- Registers both `GridMap` and `GridMapEditorPlugin` (the editor's
  paint-style cell placement tool) via `get_doc_classes()` in `config.py`.
- Distinct from `scene/resources/3d/mesh_library.h`'s `MeshLibrary`, which
  this module consumes but does not define — a `MeshLibrary` is built from
  an arbitrary source scene's meshes/collision shapes, independent of any
  `GridMap` instance using it.
- Cell coordinates are `int16_t`-range (±32767 per axis), not unbounded;
  very large worlds should shift the `GridMap` origin or use multiple
  `GridMap` nodes rather than relying on a single grid spanning the whole
  level.
