# modules/vorbis/

Ogg Vorbis audio decoding (and, in editor builds, encoding), wrapping
**thirdparty/libvorbis** on top of the packet container support from
[`modules/ogg/README.md`](../ogg/README.md). Exposes Vorbis audio as an
`AudioStream` and provides the `.ogg` import pipeline.

## Classes

- `audio_stream_ogg_vorbis.h` / `.cpp` — `AudioStreamOggVorbis` (`AudioStream`
  subclass holding a `Ref<OggPacketSequence>`) and
  `AudioStreamPlaybackOggVorbis` (`AudioStreamPlaybackResampled` subclass that
  decodes audio samples from an `OggPacketSequencePlayback` cursor). The two
  classes are friends of each other.
- `resource_importer_ogg_vorbis.h` / `.cpp` — `ResourceImporterOggVorbis`, the
  editor-only `.ogg` → `AudioStreamOggVorbis` import pipeline.

Registered in `register_types.cpp`: `AudioStreamOggVorbis` and its playback
class at `MODULE_INITIALIZATION_LEVEL_SCENE`; `ResourceImporterOggVorbis` at
`MODULE_INITIALIZATION_LEVEL_EDITOR` (`TOOLS_ENABLED` only), added via
`EditorNode::add_init_callback`.

## Relationship to modules/ogg/

`config.py` declares a dependency on `ogg`
(`env.module_add_dependencies("vorbis", ["ogg"])`): the raw Vorbis packet
stream is stored and iterated using `OggPacketSequence` /
`OggPacketSequencePlayback`, while this module decodes the actual audio
samples from those packets.

## Notes

- No module-specific build options.
