# modules/text_server_adv/

The default, fully-featured `TextServer` backend: BiDi (bidirectional text),
complex script shaping, and advanced font features, built on ICU, HarfBuzz,
and (optionally) SIL Graphite. Registered as `TextServerAdvanced`.

## Classes

- `text_server_adv.h` / `.cpp` — `TextServerAdvanced`, a
  `TextServerExtension` (`servers/text/text_server_extension.h`)
  implementation. Uses ICU (`ubidi`, `ubrk`, `uscript`, `uspoof`, …) for
  Unicode BiDi/script/line-break analysis, HarfBuzz for glyph shaping, and
  FreeType (guarded by `MODULE_FREETYPE_ENABLED`) to rasterize outlines.
  Optional MSDF/SVG-in-OpenType glyph rendering pulls in `modules/msdfgen/`
  and `modules/svg/` when enabled.
- `script_iterator.h` / `.cpp` — `ScriptIterator`, segments a string into
  runs of a single Unicode script for per-run shaping.
- `thorvg_svg_in_ot.h` / `.cpp` — renders `SVG ` OpenType color-glyph tables
  (as used by some emoji/color fonts) via ThorVG.

## Notes

- Declares dependencies on `freetype`, `msdfgen`, and `svg` in `config.py`
  (`env.module_add_dependencies(..., True)` — required, not optional).
- `graphite` build option (default on) adds SIL Graphite smart-font support
  for complex scripts not fully covered by HarfBuzz alone.
- This is the server most projects use; see
  [`modules/text_server_fb/README.md`](../text_server_fb/README.md) for the
  lighter-weight alternative used when ICU/HarfBuzz are unavailable or
  unwanted (e.g. minimal export size).
