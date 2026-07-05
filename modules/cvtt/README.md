# modules/cvtt/

Wraps **thirdparty/cvtt** ("Convection Texture Tools") to provide BC6H/BC7
block-compression *encoding* — the high dynamic range and high quality
variants of the BC-family texture formats decoded generically by
[`modules/bcdec/README.md`](../bcdec/README.md).

## Classes

- `image_compress_cvtt.h` / `.cpp` — `image_compress_cvtt()`, a free function
  installed as an `Image` compression hook.

`register_types.cpp` wires it into `Image::_image_compress_bptc_func` at
`MODULE_INITIALIZATION_LEVEL_SCENE`.

## Notes

- `can_build` requires either an editor build or the `cvtt_export_templates`
  SCons option (default off) — BPTC encoding is primarily an editor-time
  import operation, so export templates only pay the binary-size cost of
  bundling the encoder if this option is explicitly enabled (see
  `config.py`).
