# drivers/

`drivers/` contains the concrete, hardware/OS-facing implementations that
back the abstract interfaces declared in `servers/` (see
`servers/README.md`). Scene and editor code never references this
directory directly — it only exists so a given `RenderingServer`,
`AudioServer`, etc. has something real to drive on each platform.

## Graphics drivers

- **`vulkan/`** — `RenderingDeviceDriverVulkan`, the primary modern backend.
  Implements the `RenderingDeviceDriver` interface
  (`servers/rendering/rendering_device_driver.h`) on top of the Vulkan API;
  used on Windows, Linux, Android, and (via MoltenVK) macOS/iOS.
- **`d3d12/`** — `RenderingDeviceDriverD3D12`, the Direct3D 12 backend,
  Windows-only.
- **`metal/`** — `RenderingDeviceDriverMetal`, the native Metal backend for
  macOS/iOS (Apple platforms can use this instead of MoltenVK-over-Vulkan).
- **`gles3/`** — The OpenGL ES 3 / desktop GL compatibility renderer. Unlike
  the three above, this does *not* go through the `RenderingDevice`
  abstraction — it implements the relevant `RenderingServer` rendering
  logic more directly, which is why it's structured differently
  (`rasterizer_gles3.h` and friends). This is the fallback path for
  hardware/drivers too old for Vulkan/D3D12/Metal.
- **`gl_context/`** and **`egl/`** — Platform-agnostic helpers for creating
  a GL context/surface (used by `gles3/` across platforms).
- **`apple/`, `apple_embedded/`** — Shared Apple-platform rendering/OS glue
  used by both macOS and iOS.

## Audio drivers

Each implements the low-level "push/pull audio buffers to the OS" side
that `servers/audio/audio_server.h` mixes into:

- **`wasapi/`** — Windows (WASAPI).
- **`alsa/`**, **`pulseaudio/`** — Linux (ALSA direct, and PulseAudio).
- **`coreaudio/`** — macOS/iOS (Core Audio).
- **`xaudio2/`** — Alternate Windows backend (XAudio2).

MIDI input follows the same per-platform split: **`alsamidi/`** (Linux),
**`coremidi/`** (Apple), **`winmidi/`** (Windows).

## Other drivers

- **`unix/`** — Shared POSIX OS-layer helpers (used by Linux/macOS/Android/
  Web `platform/` implementations): file access, IP/socket helpers, thread
  primitives.
- **`windows/`** — Shared Windows OS-layer helpers, analogous to `unix/`.
- **`png/`** — PNG encode/decode wrapper used by the image-loading path.
- **`sdl/`** — SDL-based input backend (controller/joypad support layer).
- **`accesskit/`** — Bindings to the AccessKit library backing
  `servers/display/accessibility_server.h`.
- **`backtrace/`** — Crash backtrace capture used by the crash handler.

## How a driver is selected

Graphics and audio drivers are chosen partly at **build time** and partly
at **runtime**:

- Build time: each platform's `platform/<platform>/detect.py` decides which
  driver sources are compiled in for that target (e.g. Windows always
  builds `vulkan/` and `d3d12/` and `gles3/`; a headless server build might
  exclude `gles3/`). A driver module also declares support via its own
  `config.py`/`SCsub` under `drivers/`.
- Runtime: of the drivers compiled in, the actual one used is chosen by
  command-line flag or project setting — `--rendering-driver vulkan|d3d12|
  metal|opengl3` and `--audio-driver <name>`, falling back automatically if
  the preferred driver fails to initialize (e.g. no Vulkan-capable GPU).

`servers/rendering_server.h` and `servers/audio/audio_server.h` are the
interfaces these drivers satisfy; `platform/<platform>/` is where the
runtime selection/fallback logic and driver registration lives (see
`servers/README.md` for the abstract-interface pattern in general).

## Where to look for common tasks

| Task | Start here |
|---|---|
| Fix/extend Vulkan rendering | `vulkan/rendering_device_driver_vulkan.cpp` |
| Fix/extend the GLES3 fallback renderer | `gles3/` |
| Add a feature to an audio backend | `wasapi/`, `alsa/`, `coreaudio/`, etc., following `servers/audio/audio_server.h`'s driver interface |
| Debug driver selection/fallback | The relevant `platform/<platform>/` `detect.py` and OS entry point |
