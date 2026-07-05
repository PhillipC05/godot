# modules/xatlas_unwrap/

Wraps **thirdparty/xatlas** to provide automatic UV2 unwrapping for
lightmap baking. Editor-only (`config.py` returns `env.editor_build`) since
unwrapping happens at mesh-import/bake time, not at runtime.

## Classes

- `register_types.cpp` — no Godot classes; instead installs
  `xatlas_mesh_lightmap_unwrap_callback()` as the engine's
  `array_mesh_lightmap_unwrap_callback` function pointer (declared `extern`
  and consumed by `ArrayMesh::lightmap_unwrap()`). The callback builds an
  `xatlas::MeshDecl` from the mesh's vertices/normals/indices, charts and
  packs it via `xatlas::Generate()`, and returns the resulting UV2 layout
  plus a possibly-remapped vertex/index buffer back to the caller.

## Notes

- Includes an MD5-based mesh cache: `p_cache_data` lets a re-bake skip
  re-unwrapping identical geometry (same texel size, vertices, normals,
  indices hash) by returning a previously computed UV2 layout verbatim.
- `xatlas::PackOptions.maxChartSize` is capped at 4094 (not 4096) to leave
  room for the 1-texel padding lightmap atlassing needs between charts.
- Used by [`modules/lightmapper_rd/README.md`](../lightmapper_rd/README.md)
  and any other lightmapper needing UV2, but has no direct dependency on it
  — the two modules communicate only through the `ArrayMesh` callback
  pointer, not a compile-time link.
