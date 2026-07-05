# modules/tga/

TGA (Truevision TARGA) image loading. A small, self-contained decoder (no
thirdparty dependency).

## Classes

- `image_loader_tga.h` / `.cpp` — `ImageLoaderTGA`, an `ImageFormatLoader`
  registered via `ImageLoader::add_image_format_loader()` in
  `register_types.cpp` at `MODULE_INITIALIZATION_LEVEL_SCENE`.

## Notes

- Load-only; there is no TGA saver. No module-specific build options.
