# modules/jpg/

JPEG image loading, wrapping **thirdparty/libjpeg-turbo**, plus a Motion-JPEG
movie writer used by the editor's Movie Maker mode.

## Classes

- `image_loader_libjpeg_turbo.h` / `.cpp` — `ImageLoaderJPG`, an
  `ImageFormatLoader` registered via
  `ImageLoader::add_image_format_loader()` at
  `MODULE_INITIALIZATION_LEVEL_SCENE`.
- `movie_writer_mjpeg.h` / `.cpp` — `MovieWriterMJPEG`, a `MovieWriter`
  backend registered via `MovieWriter::add_writer()` at
  `MODULE_INITIALIZATION_LEVEL_SERVERS` (compiled out if the `MovieWriterMJPEG`
  class is disabled).

## Notes

- Load-only for still images; there is no general-purpose JPEG saver. libjpeg
  is compiled with both 8-bit and 12-bit sample depth variants
  (`BITS_IN_JSAMPLE`), see `SCsub`.
- No module-specific build options beyond the shared `builtin_libjpeg_turbo`
  SCons option.
