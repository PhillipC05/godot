# servers/

`servers/` defines Godot's abstract backend interfaces — rendering,
physics, audio, display, navigation, XR, text shaping — as pure APIs that
`scene/` and the editor call into without knowing which concrete backend is
running underneath. This decoupling is what lets the same `Node` code run
unchanged across Vulkan/GLES3/Metal/D3D12, across Windows/Linux/macOS/
Android/iOS/Web, and (for rendering/physics) across multiple threads via a
command-queue wrapper.

## Why servers exist

Two problems this layer solves:

- **Backend independence.** A `MeshInstance3D` in `scene/` calls
  `RenderingServer::mesh_create()` / `instance_set_base()` etc. — it never
  touches Vulkan or GLES3 directly. Swapping the rendering backend, or
  running with `--rendering-driver dummy` for headless CI, doesn't require
  touching scene code.
- **Threading.** Servers are called from the main thread but can execute on
  a dedicated server thread. Each server has a `*_wrap_mt` variant
  (e.g. `physics_server_2d_wrap_mt.h`) that queues calls across the thread
  boundary transparently, so scene code is written as if everything were
  synchronous.

`Extension` classes (e.g. `PhysicsServer3DExtension`,
`TextServerExtension`) let GDExtension implement an entire server backend
out-of-tree (this is how alternative physics engines like Jolt plug in as
modules — see `modules/jolt_physics/`).

## The servers

| Server | Files | Purpose |
|---|---|---|
| `RenderingServer` | `rendering/` | 2D/3D drawing, meshes, materials, lights, viewports. The biggest and most layered server — see below. |
| `PhysicsServer2D` / `PhysicsServer3D` | `physics_2d/`, `physics_3d/` | Rigid/character/area bodies, shapes, collision queries, joints. Godot's built-in implementation lives in `modules/godot_physics_2d`/`3d`; Jolt is an alternative 3D backend module. |
| `AudioServer` | `audio/` | Mixing graph, audio buses/effects (`audio/effects/`), stream playback, output device management. |
| `DisplayServer` | `display/` | Windowing, input events, clipboard, cursors, native menus (`native_menu.h`), accessibility (`accessibility_server.h`). One implementation per platform lives under `platform/`. |
| `NavigationServer2D` / `NavigationServer3D` | `navigation_2d/`, `navigation_3d/` | Navigation mesh baking, pathfinding queries, avoidance. |
| `XRServer` | `xr/` | VR/AR interfaces, pose/tracker data (`xr_hand_tracker.h`, `xr_face_tracker.h`, `xr_body_tracker.h`). |
| `TextServer` | `text/` | Text shaping/layout/font rendering, abstracted so ICU/HarfBuzz-based and simple fallback implementations are interchangeable. |
| `CameraServer` | `camera/` | Physical camera feed access (AR/webcam passthrough). |
| `MovieWriter` | `movie_writer/` | Frame-by-frame video capture (`--write-movie`), e.g. `movie_writer_pngwav` for PNG+WAV output. |

`servers_debugger.h` (`debugger/`) hooks server-side state (draw calls,
physics counters, etc.) into the remote debugger/profiler.

## The abstract-interface → driver-implementation pattern

Each server is declared as an abstract class (or a class with virtual hook
points) in `servers/`, with concrete implementations living elsewhere:

- **`RenderingServer`** (`servers/rendering_server.h`) is the public API.
  Most of its real logic lives in `servers/rendering/renderer_*` (scene/
  canvas culling, viewport composition), which talks to a
  `RenderingDevice` abstraction (`servers/rendering/rendering_device.h`)
  implemented per-backend in `drivers/vulkan/`, `drivers/d3d12/`,
  `drivers/metal/` (see `drivers/README.md`). The older GLES3 path in
  `drivers/gles3/` bypasses `RenderingDevice` and implements
  `RenderingServer`'s lower-level pieces more directly.
- **`PhysicsServer2D`/`3D`** are abstract; `modules/godot_physics_2d`/`3d`
  provide Godot's built-in implementation, and `modules/jolt_physics`
  provides an alternative, both registered at build time via each module's
  `config.py`.
- **`DisplayServer`** is abstract; each `platform/<platform>/` directory
  provides the concrete subclass (window creation, event pump) for that OS.
  `display_server_headless.h` is the no-window implementation used for
  server/CI builds.
- **`TextServer`** is abstract; `modules/text_server_adv` (HarfBuzz/ICU,
  full-featured) and `modules/text_server_fb` (fallback, no shaping deps)
  are alternative implementations selected at build/runtime.

The common shape: pick the abstract interface in `servers/` to see *what*
a subsystem can do; find the concrete implementation in `drivers/`,
`platform/`, or `modules/` to see *how* a specific backend does it.

## Where to look for common tasks

| Task | Start here |
|---|---|
| Add a new `RenderingServer` method | `servers/rendering_server.h`, then wire through `renderer_viewport.cpp`/`renderer_scene_cull.cpp`/`renderer_canvas_cull.cpp` as appropriate |
| Add a physics query/shape | `servers/physics_server_3d.h` (or `_2d.h`), then implement in `modules/godot_physics_3d/` |
| Work on audio effects/buses | `servers/audio/audio_server.h`, `servers/audio/effects/` |
| Add an input/window feature | `servers/display_server.h`, then the relevant `platform/<platform>/` implementation |
| Work on font/text shaping | `servers/text_server.h`, then `modules/text_server_adv/` |
