# modules/mp3/

MP3 audio decoding, wrapping **thirdparty/dr_libs/dr_mp3.h** (a single-header
decoder, unlike the multi-file thirdparty sources pulled in by
[`modules/ogg/README.md`](../ogg/README.md) /
[`modules/vorbis/README.md`](../vorbis/README.md)). MP3 is its own container
format, so this module is fully independent of the Ogg-based codec modules.
Exposes MP3 audio as an `AudioStream` and provides the `.mp3` import
pipeline.

## Classes

- `audio_stream_mp3.h` / `.cpp` — `AudioStreamMP3` and its playback class,
  decoding directly against `dr_mp3.h`.
- `resource_importer_mp3.h` / `.cpp` — `ResourceImporterMP3`, the editor-only
  `.mp3` → `AudioStreamMP3` import pipeline.

Registered in `register_types.cpp`: `AudioStreamMP3` at
`MODULE_INITIALIZATION_LEVEL_SCENE`; `ResourceImporterMP3` at
`MODULE_INITIALIZATION_LEVEL_EDITOR` (`TOOLS_ENABLED` only), added via
`EditorNode::add_init_callback`.

## Notes

- Build option `mp3_extra_formats` (default off): when disabled, defines
  `DR_MP3_ONLY_MP3` to strip MP1/MP2 decoding support from dr_mp3 and reduce
  binary size (see `config.py`).
