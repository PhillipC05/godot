# modules/lightmapper_rd/

GPU-accelerated lightmap baker built on the `RenderingDevice` compute/raster
API, so it runs on whichever backend (Vulkan, Metal, D3D12) the project uses
rather than requiring a dedicated ray-tracing library. Editor-only (`config.py`
returns `env.editor_build`) since baking happens at import/edit time, not at
runtime.

## Classes

- `lightmapper_rd.h` / `.cpp` — `LightmapperRD`, a `Lightmapper` (see
  `scene/3d/lightmapper.h`) implementation. Registered as the engine's GPU
  lightmapper via `Lightmapper::create_gpu` in `register_types.cpp`.
  Pipeline: `_blit_meshes_into_atlas()` packs mesh UV2 charts into a shared
  atlas, `_create_acceleration_structures()` builds a triangle/cluster grid
  for ray traversal, `_raster_geometry()` rasterizes position/normal/albedo
  G-buffers per texel, then compute shaders trace rays per-texel for direct
  and bounced lighting, followed by `_denoise()`/`_denoise_oidn()` (JNLM or
  Intel Open Image Denoise) and `_dilate()` to bleed color across UV seams.

## Shaders

Compute/raster stages are plain GLSL compiled through the standard
`RDShaderFile` pipeline (`*.glsl` files, `.glsl.gen.h` generated wrappers):

- `lm_raster.glsl` — rasterizes mesh geometry into atlas-space G-buffers.
- `lm_compute.glsl` — main ray-tracing/lighting compute shader.
- `lm_blendseams.glsl` — blends lightmap texels across UV chart seams.
- `lm_common_inc.glsl`, `lm_area_lights_inc.glsl` — shared structs/includes.

## Notes

- Registers `rendering/lightmapping/*` project settings (ray counts per
  quality level, region size, denoiser choice) via `GLOBAL_DEF` in
  `register_types.cpp`.
- Gated by `_3D_DISABLED`; contributes nothing to 2D-only or server builds.
- No module dependencies of its own; relies on `RenderingDevice` being backed
  by a working compute-capable driver at bake time.
