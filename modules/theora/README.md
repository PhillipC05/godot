# modules/theora/

Ogg Theora video decoding, wrapping **thirdparty/libtheora** on top of the
packet container support from [`modules/ogg/README.md`](../ogg/README.md);
audio tracks muxed alongside the video in the same Ogg container are decoded
via [`modules/vorbis/README.md`](../vorbis/README.md). Exposes Theora video
as a `VideoStream` and provides an editor movie-writer for exporting `.ogv`.

## Classes

- `video_stream_theora.h` / `.cpp` — `VideoStreamPlaybackTheora`
  (`VideoStreamPlayback` subclass that demuxes Ogg pages, feeding the Theora
  stream to `th_dec_ctx`/`th_ycbcr_buffer` for video frames and the Vorbis
  stream to `vorbis_dsp_state` for audio) and `VideoStreamTheora` (the
  `VideoStream` resource wrapper), plus `ResourceFormatLoaderTheora`.
- `editor/movie_writer_ogv.h` / `.cpp`, `editor/rgb2yuv.h` — `MovieWriterOGV`,
  an editor-only `MovieWriter` backend for encoding the Movie Maker mode
  output to `.ogv`.

Registered in `register_types.cpp`: `MovieWriterOGV` at
`MODULE_INITIALIZATION_LEVEL_SERVERS` (via `MovieWriter::add_writer`);
`ResourceFormatLoaderTheora` and `VideoStreamTheora` at
`MODULE_INITIALIZATION_LEVEL_SCENE`.

## Relationship to modules/ogg/ and modules/vorbis/

`config.py` declares `env.module_add_dependencies("theora", ["ogg", "vorbis"])`:
a Theora video file conventionally has one Ogg stream carrying Theora video
and another carrying Vorbis audio, both demuxed from the same Ogg page stream
by `VideoStreamPlaybackTheora`.

## Notes

- `can_build` returns `False` for RISC-V (`arch` starting with `"rv"`); the
  bundled encoder/decoder assumes x86 SIMD-optimized source variants
  (`x86_libtheora_opt_gcc` / `x86_libtheora_opt_vc`) that aren't available
  there.
