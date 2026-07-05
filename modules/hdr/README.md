# modules/hdr/

Radiance HDR (`.hdr`) image loading — high dynamic range images, commonly
used for environment maps and sky textures. A small, self-contained decoder
(no thirdparty dependency).

## Classes

- `image_loader_hdr.h` / `.cpp` — `ImageLoaderHDR`, an `ImageFormatLoader`
  registered via `ImageLoader::add_image_format_loader()` in
  `register_types.cpp` at `MODULE_INITIALIZATION_LEVEL_SCENE`.

## Notes

- Load-only; there is no HDR saver. No module-specific build options.
