# modules/dds/

DDS (DirectDraw Surface) texture container support — load and save. A
self-contained implementation (no thirdparty dependency); DDS itself is just
a container header wrapping already block-compressed pixel data (decoded
elsewhere, e.g. by [`modules/bcdec/README.md`](../bcdec/README.md)).

## Classes

- `texture_loader_dds.h` / `.cpp` — `ResourceFormatDDS`, a
  `ResourceFormatLoader` registered via
  `ResourceLoader::add_resource_format_loader()`.
- `image_saver_dds.h` / `.cpp` — `save_dds()` / `save_dds_buffer()`, free
  functions installed as `Image` save hooks
  (`Image::save_dds_func` / `Image::save_dds_buffer_func`).
- `dds_enums.h` — DDS format/flag constants used by both.

Wired up in `register_types.cpp` at `MODULE_INITIALIZATION_LEVEL_SCENE`;
the resource loader is conditionally compiled out if the `Texture` class is
disabled (`GD_IS_CLASS_ENABLED(Texture)`).

## Notes

- No module-specific build options; `can_build` is unconditionally `True`.
