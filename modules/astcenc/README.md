# modules/astcenc/

Wraps **thirdparty/astc-encoder** (ARM's `astcenc`) to provide ASTC texture
compression and decompression. ASTC is a modern, variable block-size
compressed texture format widely supported on mobile GPUs.

## Classes

- `image_compress_astcenc.h` / `.cpp` — `_compress_astc()` and
  `_decompress_astc()`, free functions installed as `Image` compression
  hooks rather than registered `Object` classes.

`register_types.cpp` wires these into the generic `Image` compression
dispatch at `MODULE_INITIALIZATION_LEVEL_SCENE`:
`Image::_image_compress_astc_func` (editor builds only, `TOOLS_ENABLED`) and
`Image::_image_decompress_astc` (all builds, since exported projects only
need to decode ASTC textures baked at import time).

## Notes

- No module-specific build options; `can_build` is unconditionally `True`.
