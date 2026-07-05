# modules/ktx/

KTX / KTX2 texture container loading, wrapping **thirdparty/libktx**. KTX2 is
a common container for Basis Universal supercompressed textures, so this
module depends on [`modules/basis_universal/README.md`](../basis_universal/README.md)
for transcoding.

## Classes

- `texture_loader_ktx.h` / `.cpp` — `ResourceFormatKTX`, a
  `ResourceFormatLoader` registered via
  `ResourceLoader::add_resource_format_loader()` in `register_types.cpp` at
  `MODULE_INITIALIZATION_LEVEL_SCENE` (compiled out if the `ImageTexture`
  class is disabled).

## Notes

- Load-only. `config.py` declares
  `module_add_dependencies("ktx", ["basis_universal"])`. When Vulkan support
  is disabled, the module falls back to a bundled `vkformat_enum.h` instead of
  `thirdparty/vulkan`'s headers (see `SCsub`).
