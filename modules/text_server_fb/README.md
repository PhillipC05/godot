# modules/text_server_fb/

Fallback `TextServer` backend: FreeType-only glyph rendering with no BiDi,
complex script shaping, or ICU dependency. Registered as
`TextServerFallback`, and **disabled by default** (`is_enabled()` returns
`False` in `config.py` — enable with `module_text_server_fb_enabled=yes`).

## Classes

- `text_server_fb.h` / `.cpp` — `TextServerFallback`, a
  `TextServerExtension` (`servers/text/text_server_extension.h`)
  implementation covering left-to-right text layout and shaping via
  FreeType only; no HarfBuzz, ICU, or Graphite. Optional MSDF/SVG-in-OpenType
  glyph rendering still pulls in `modules/msdfgen/` and `modules/svg/` when
  those modules are enabled.
- `thorvg_svg_in_ot.h` / `.cpp` — same ThorVG-based `SVG ` OpenType
  color-glyph table renderer as in `text_server_adv`.

## Notes

- Declares the same required dependencies as the advanced server
  (`freetype`, `msdfgen`, `svg`) in `config.py`.
- Exists for builds that need a much smaller text stack (no ICU data
  tables) or that only ever render simple LTR scripts; most projects should
  use [`modules/text_server_adv/README.md`](../text_server_adv/README.md)
  instead, which is the default and supports RTL/complex scripts.
- Both text server modules can theoretically coexist; the engine picks the
  first available one it can create at startup, preferring the advanced
  server when both are built in.
