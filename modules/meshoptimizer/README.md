# modules/meshoptimizer/

Wraps **thirdparty/meshoptimizer** to provide mesh optimization and LOD
generation. Like `modules/msdfgen/` and `modules/freetype/`, this module
registers no Godot classes — it only wires meshoptimizer's C functions into
`SurfaceTool`'s function-pointer hooks in `register_types.cpp`. Always
built (`can_build` unconditionally `True`).

## Hooks installed

`register_types.cpp` assigns these `SurfaceTool` static function pointers
(declared in `scene/resources/surface_tool.h`) directly to meshoptimizer
entry points:

- `optimize_vertex_cache_func` / `optimize_vertex_fetch_remap_func` —
  reorder vertices/indices for better GPU post-transform cache hit rate.
- `simplify_func` / `simplify_with_attrib_func` / `simplify_scale_func` —
  mesh simplification (LOD generation), optionally preserving vertex
  attributes (UVs, normals, colors) during collapse.
- `generate_remap_func` / `remap_vertex_func` / `remap_index_func` —
  vertex deduplication/remapping.
- `generate_tangents_func` — tangent-space generation for normal mapping.

## Notes

- `SurfaceTool::generate_lods()` and related mesh-processing calls are
  effectively unimplemented (no-ops or unavailable) if this module is
  disabled, since the function pointers stay null.
- No dependencies on other modules; meshoptimizer is vendored under
  `thirdparty/meshoptimizer`.
