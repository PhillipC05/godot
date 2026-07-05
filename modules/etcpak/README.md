# modules/etcpak/

Wraps **thirdparty/etcpak** to provide fast ETC1/ETC2 texture compression and
decompression, plus BC1/BC3 encoding (a faster alternative to the
higher-quality BC6H/BC7 encoder in
[`modules/cvtt/README.md`](../cvtt/README.md)).

## Classes

- `image_compress_etcpak.h` / `.cpp` — `_compress_etc1()`, `_compress_etc2()`,
  `_compress_bc()`, free functions installed as `Image` compression hooks
  (editor builds only).
- `image_decompress_etcpak.h` / `.cpp` — `_decompress_etc()`, a free function
  installed as an `Image` decompression hook (all builds).

`register_types.cpp` wires these into `Image::_image_compress_etc1_func`,
`Image::_image_compress_etc2_func`, `Image::_image_compress_bc_func`
(`TOOLS_ENABLED` only), and `Image::_image_decompress_etc1` /
`Image::_image_decompress_etc2`, at `MODULE_INITIALIZATION_LEVEL_SCENE`.

## Notes

- No module-specific build options; `can_build` is unconditionally `True`.
