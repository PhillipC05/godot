# modules/svg/

Wraps **thirdparty/thorvg** to rasterize SVG images to `Image` bitmaps at
load time. Godot does not render SVG vector paths at runtime — this module
only decodes an `.svg` file/buffer into a fixed-resolution raster `Image`,
same as any other `ImageFormatLoader`.

## Classes

- `image_loader_svg.h` / `.cpp` — `ImageLoaderSVG`, an `ImageFormatLoader`
  registered for `.svg`/`.svgz` extensions. `create_image_from_string()` /
  `create_image_from_utf8_buffer()` feed SVG markup to ThorVG and blit the
  result into an `Image` at a caller-supplied `p_scale`; `p_upsample`
  optionally rasterizes at a higher resolution before downscaling for
  smoother edges on small icon-style SVGs. `set_forced_color_map()` lets the
  editor recolor SVG icons (e.g. for the icon theming system) by rewriting
  `fill`/`stroke` color attributes before rasterization via
  `_replace_color_property()`.

## Notes

- Depends on `jpg` and `webp` in `config.py` (`env.module_add_dependencies`)
  since ThorVG's build can embed raster images referenced from SVG markup
  (e.g. `<image>` tags) using those decoders.
- Rasterization happens once at import/load; there is no live vector
  re-render on resize, so editor icons and any SVG assets are baked to a
  specific pixel size when loaded.
