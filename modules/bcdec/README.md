# modules/bcdec/

Wraps **thirdparty/bcdec** (a single-header decoder) to provide decompression
for BC1–BC7 block-compressed textures (the DirectX/DDS-style compressed
texture formats, as opposed to mobile-oriented formats like ASTC/ETC handled
by [`modules/astcenc/README.md`](../astcenc/README.md) and
[`modules/etcpak/README.md`](../etcpak/README.md)).

## Classes

- `image_decompress_bcdec.h` / `.cpp` — `image_decompress_bcdec()`, a free
  function installed as an `Image` decompression hook.

`register_types.cpp` wires it into `Image::_image_decompress_bc` and
`Image::_image_decompress_bptc` at `MODULE_INITIALIZATION_LEVEL_SCENE` (BPTC
being the extended BC6H/BC7 formats, decoded by the same function).

## Notes

- Decode-only: compressing to BC1–BC7 is handled separately by
  [`modules/cvtt/README.md`](../cvtt/README.md) (BC6H/BC7 encode) and
  `Image::_image_compress_bc_func` from [`modules/etcpak/README.md`](../etcpak/README.md)
  (BC1/BC3 encode).
- No module-specific build options; `can_build` is unconditionally `True`.
