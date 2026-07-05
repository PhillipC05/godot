# modules/vhacd/

Wraps **thirdparty/vhacd** (V-HACD, Volumetric Hierarchical Approximate
Convex Decomposition) to split a concave mesh into a set of convex hulls
suitable for physics collision shapes. Registers no Godot classes — it
installs a single function pointer, `Mesh::convex_decomposition_function`,
in `register_types.cpp`. Always built (`can_build` unconditionally `True`).

## Classes

- `register_types.cpp` — `convex_decompose()`: translates a
  `MeshConvexDecompositionSettings` resource (concavity, resolution, max
  hull count, plane/convex-hull downsampling, PCA normalization, etc.) into
  `VHACD::IVHACD::Parameters`, runs `VHACD::IVHACD::Compute()`, and returns
  one point/index list per resulting convex hull.

## Notes

- Called from `Mesh::convex_decompose()`, which is exposed to the editor as
  "Create Multiple Convex Collision Siblings" / the equivalent GDScript
  API — this is the only convex decomposition backend in the engine.
- No dependencies on other modules; V-HACD is vendored under
  `thirdparty/vhacd`.
