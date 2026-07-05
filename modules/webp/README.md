# modules/webp/

WebP image loading and saving, wrapping **thirdparty/libwebp**.

## Classes

- `image_loader_webp.h` / `.cpp` — `ImageLoaderWebP`, an `ImageFormatLoader`
  registered via `ImageLoader::add_image_format_loader()`.
- `resource_saver_webp.h` / `.cpp` — `ResourceSaverWebP`, a
  `ResourceFormatSaver` registered via
  `ResourceSaver::add_resource_format_saver()`.
- `webp_common.h` / `.cpp` — Shared encode/decode helpers used by both.

Both registered in `register_types.cpp` at
`MODULE_INITIALIZATION_LEVEL_SCENE`.

## Notes

- No module-specific build options beyond the shared `builtin_libwebp` SCons
  option.
