# modules/betsy/

GPU compute-shader texture compressor (BC1/BC3/BC4/BC5/BC6H block-compressed
formats) built on `RenderingDevice`, used as a fast import-time alternative
to CPU-based compressors for desktop-oriented compressed formats. Builds
for editor builds by default; can be opted into export templates via the
`betsy_export_templates` SCons option (off by default — "increases binary
size").

## Classes

- `image_compress_betsy.h` / `.cpp` — `BetsyCompressor`, an `Object`
  running its own dedicated thread (`WorkerThreadPool` + `CommandQueueMT`)
  so RenderingDevice compute dispatches don't block the calling thread.
  `compress()` pushes a `BetsyFormat` + `Image` onto the command queue;
  `_compress()` picks the right compute shader (`_get_shader()` compiles
  and caches one `BetsyShader` per `BetsyShaderType`), dispatches it, and
  writes the compressed blocks back into the `Image`. Registered as
  `Image::_image_compress_bptc_rd_func` (BC6H) and
  `Image::_image_compress_bc_rd_func` (BC1/BC3/BC4/BC5) in
  `register_types.cpp`.

## Shaders

Plain compute GLSL compiled through the standard `RDShaderFile` pipeline:

- `bc1.glsl` — BC1/DXT1 (with an optional dithering variant).
- `bc4.glsl` — BC4/BC5 single/dual-channel formats (signed and unsigned).
- `bc6h.glsl` — BC6H HDR format.
- `rgb_to_rgba.glsl` — pads RGB-only source images to RGBA before
  compression, since the compute shaders operate on 4-channel input.
- `alpha_stitch.glsl` — recombines a separately-compressed alpha channel
  back into BC3's block layout.

## Notes

- License note: `LICENSE.Betsy.md` covers the vendored Betsy compute
  shaders specifically, distinct from Godot's overall MIT license.
- This is a `RenderingDevice`-based compressor and thus requires a working
  compute-capable graphics driver at import time; it does not replace the
  CPU-based `modules/astcenc/`, `modules/etcpak/`, or `modules/bcdec/`
  codecs, which cover mobile/other formats and decode-only paths.
