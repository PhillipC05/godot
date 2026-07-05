# modules/freetype/

Wraps **thirdparty/freetype** to build the FreeType font rasterization
library into the engine. Like `modules/msdfgen/`, this module contributes
no Godot classes of its own — `initialize_freetype_module()` and
`uninitialize_freetype_module()` are empty stubs in `register_types.h` —
it exists purely to compile FreeType and expose its headers/symbols for
other modules to call directly. Always built (`can_build` unconditionally
`True`).

## Consumers

- [`modules/text_server_adv/README.md`](../text_server_adv/README.md) and
  [`modules/text_server_fb/README.md`](../text_server_fb/README.md) use
  FreeType directly (`#ifdef MODULE_FREETYPE_ENABLED`) to load font files
  and rasterize glyph outlines to bitmaps.
- [`modules/msdfgen/README.md`](../msdfgen/README.md) depends on this
  module (`env.module_add_dependencies`) to source glyph contours for MSDF
  generation.

## Notes

- No Godot-facing API surface — nothing to bind, no `GDREGISTER_CLASS`
  calls. Consuming code checks `MODULE_FREETYPE_ENABLED` (from
  `modules/modules_enabled.gen.h`) before using any FreeType symbol, since
  text servers can theoretically be built without it (with reduced font
  format support).
