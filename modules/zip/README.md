# modules/zip/

Wraps **thirdparty/minizip** to read and write `.zip` archives from
GDScript/C#. Only builds when the `minizip` SCons option is enabled
(`can_build` returns `env["minizip"]`).

## Classes

- `zip_packer.h` / `.cpp` — `ZIPPacker`, a `RefCounted` around minizip's
  `zipFile` write API. `open()` creates/appends/updates an archive
  (`ZipAppend` enum), `start_file()` / `write_file()` / `close_file()`
  stream one entry at a time, `add_directory()` writes a directory entry
  with explicit Unix permissions. `CompressionLevel` maps directly to zlib's
  `Z_*` constants.
- `zip_reader.h` / `.cpp` — `ZIPReader`, a `RefCounted` around minizip's
  `unzFile` read API. `get_files()` lists entries, `read_file()` extracts
  one entry fully into a `PackedByteArray`, `file_exists()` and
  `get_compression_level()` query metadata without extracting.

## Notes

- Both classes read/write through Godot's `FileAccess` abstraction
  (`fa` member) rather than talking to the OS filesystem directly, so
  archives can live inside a `res://`/`user://` path or any other
  `FileAccess`-backed location (e.g. a PCK).
- No relation to `core/io/zip_io.h` (used internally for `.pck`/export
  archives) beyond sharing the same underlying minizip library — this
  module is the user-facing GDScript API.
