# modules/basis_universal/

Wraps **thirdparty/basis_universal** to provide Basis Universal supercompressed
texture support — a GPU-agnostic intermediate format that transcodes at load
time to whichever compressed texture format the target GPU natively supports
(BCn, ASTC, ETC, PVRTC, etc.), avoiding the need to ship every format
separately.

## Classes

- `image_compress_basisu.h` / `.cpp` — `basis_universal_packer()` (editor
  builds only) and `basis_universal_unpacker()` /
  `basis_universal_unpacker_ptr()`, free functions installed as `Image`
  compression hooks.

`register_types.cpp` wires these into `Image::basis_universal_packer` /
`Image::basis_universal_unpacker` / `Image::basis_universal_unpacker_ptr` at
`MODULE_INITIALIZATION_LEVEL_SCENE`, and registers three project settings
(editor-only) controlling the encoder's RDO dictionary size and zstd
supercompression: `rendering/textures/basis_universal/rdo_dict_size`,
`.../zstd_supercompression`, `.../zstd_supercompression_level`.

## Relationship to other modules

- [`modules/ktx/README.md`](../ktx/README.md) depends on this module
  (`module_add_dependencies("ktx", ["basis_universal"])`) since `.ktx2` is a
  common container format for Basis Universal supercompressed textures.
- Editor builds additionally depend on the `tinyexr` thirdparty dependency
  for the encoder path (declared in `config.py`).

## Notes

- No module-specific build options beyond the implicit editor-vs-export
  encoder/decoder split (encoding is editor-only; exported projects only
  transcode already-encoded textures).
