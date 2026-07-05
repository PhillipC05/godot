# modules/ogg/

Wraps **thirdparty/libogg** to provide the low-level Ogg container/bitstream
primitives (page and packet framing) shared by the codec modules built on top
of it: [`modules/vorbis/README.md`](../vorbis/README.md) (audio) and
[`modules/theora/README.md`](../theora/README.md) (video). This module does
not decode audio or video itself — it only stores and iterates raw Ogg
packet data.

## Classes

- `ogg_packet_sequence.h` / `.cpp` — `OggPacketSequence`, a `Resource` storing
  the pages/packets of a decoded Ogg bitstream, along with per-page granule
  positions, sampling rate, and total length. `OggPacketSequencePlayback`, a
  friend class of `OggPacketSequence`, provides a playback/iteration cursor
  over the stored packets used by codec modules during decode.

Both classes are registered in `register_types.cpp` at
`MODULE_INITIALIZATION_LEVEL_SCENE`.

## Notes

- This is the base dependency other Ogg-based codec modules declare via
  `env.module_add_dependencies(..., ["ogg"])` in their own `config.py`; it has
  no dependencies of its own and no build-time options.
