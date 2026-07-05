# modules/bmp/

BMP image loading. A small, self-contained decoder (no thirdparty
dependency) for the Windows Bitmap format.

## Classes

- `image_loader_bmp.h` / `.cpp` — `ImageLoaderBMP`, an `ImageFormatLoader`
  registered via `ImageLoader::add_image_format_loader()` in
  `register_types.cpp` at `MODULE_INITIALIZATION_LEVEL_SCENE`.

## Notes

- Load-only; there is no BMP saver. No module-specific build options.
