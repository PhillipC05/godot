# modules/msdfgen/

Wraps **thirdparty/msdfgen** to generate multi-channel signed distance field
(MSDF) textures. This module contributes no Godot classes of its own — both
`initialize_msdfgen_module()` and `uninitialize_msdfgen_module()` are empty
stubs in `register_types.h` — it exists purely to compile the third-party
library and expose its headers/symbols for other modules to call directly.

## Consumers

- `modules/text_server_adv/` uses msdfgen to rasterize crisp, scalable glyph
  outlines for `FontFile` dynamic MSDF font rendering
  (`Font.multichannel_signed_distance_field`), letting the GPU shader-based
  text renderer scale glyphs to any size from a single baked texture without
  the blurring/aliasing of plain bitmap fonts.

## Notes

- `config.py` declares a dependency on `freetype` (`env.module_add_dependencies`)
  since msdfgen's font-outline pipeline sources contours from FreeType.
  `SCsub` prepends `thirdparty/freetype/include`, `thirdparty/msdfgen`, and
  `thirdparty/nanosvg` include paths for the vendored sources.
- Only the `core/` subset of msdfgen is built; the library's own bitmap
  save/export (BMP/TIFF/FL32/RGBA/SVG) helpers are excluded since Godot only
  needs SDF generation, not msdfgen's file I/O.
- No Godot-facing API surface — nothing to bind, no `GDREGISTER_CLASS` calls.
