# main/

`main/` is the engine's entry point and top-level driver loop — the glue
between a platform's OS-specific `main()` (in `platform/<platform>/`) and
everything else (`core/`, `servers/`, `scene/`). It's a small directory by
design: almost all real engine logic lives elsewhere, and `main.cpp` is
mostly sequencing/orchestration.

## Startup sequence

Each platform's entry point (e.g. `platform/windows/godot_windows.cpp`)
calls into `Main`, a static class with no instance — just a sequence of
phases:

1. **`Main::setup(execpath, argc, argv, p_second_phase)`** (`main.cpp`) —
   The bulk of startup: parses command-line arguments, initializes
   `core/` (registers core types, `ProjectSettings`, `Engine`, translation,
   `Input`), brings up logging, and initializes the low-level servers
   (`DisplayServer`, `RenderingServer` driver selection, etc.) needed
   before any scene exists. Also handles `--help`/`--version` and other
   argument-only paths that exit before a window is ever created.
2. **`Main::setup2(p_show_boot_logo)`** — The second half: creates the main
   `Window`/`Viewport`, initializes `AudioServer`, sets up the boot splash
   (`setup_boot_logo()`, `splash.gen.h`/`app_icon.gen.h` — generated from
   `splash.png`/`app_icon.png` by `main_builders.py`), and brings up
   `SceneTree` (`scene/main/scene_tree.h`) so the project's main scene can
   be loaded.
3. **`Main::start()`** — Loads and instances the project's configured main
   scene (or the editor, or a test/tool mode) into the freshly created
   `SceneTree`.
4. **`Main::iteration()`** — Called once per frame by the platform's run
   loop. Computes elapsed ticks (`OS::get_ticks_usec()`), uses
   `MainTimerSync` (`main_timer_sync.h`/`.cpp`) to decide how many fixed
   `_physics_process` steps versus how much `_process` delta this frame
   needs (decoupling variable frame rate from the fixed physics tick
   rate, respecting `Engine`'s configured physics FPS and max steps per
   frame), then drives `SceneTree`'s process/physics-process/redraw for
   that slice. Returns whether the engine should keep running; the
   platform's run loop calls this in a `while (!Main::iteration())`-style
   loop until it returns `true` (quit requested).
5. **`Main::cleanup(p_force)`** — Reverse teardown: frees the scene tree,
   shuts down servers, and releases everything `setup`/`setup2`
   initialized.

`Main::is_iterating()` / `Main::force_redraw()` are used by embedders
(e.g. XR runtimes, the editor's `--single-window` cases) that need to
query or nudge the loop from outside the normal call path.

## How the OS layer hands off to the scene tree

The platform layer (`platform/<platform>/`) owns the actual OS message
pump (Win32 message loop, X11/Wayland event loop, Android's activity
lifecycle, etc.) and calls `Main::iteration()` once per pump cycle. Inside
`iteration()`, the frame's process/physics deltas are handed to
`SceneTree::process()`/`SceneTree::physics_process()`
(`scene/main/scene_tree.cpp`), which walks the `Node` tree and dispatches
`_process`/`_physics_process` notifications — see `scene/README.md` for
what happens on the `Node` side. `main/` itself never touches individual
nodes; it only owns the top-level timing/sequencing.

## Other files

- **`main_timer_sync.h`/`.cpp`** — `MainTimerSync`, the fixed-timestep
  accumulator that reconciles variable rendering frame time with a fixed
  physics tick rate (handles frame-rate independence, `Engine.time_scale`,
  and clamping runaway physics steps after a stall).
- **`performance.h`/`.cpp`** — The `Performance` singleton exposing runtime
  monitors (FPS, memory, object counts, physics/render times) queryable
  from scripts and shown in the editor's Debugger > Monitors tab.
- **`steam_tracker.h`/`.cpp`** — Optional Steam client integration hook
  (e.g. reporting app ID) for builds that support it.
- **`main_builders.py`** — SCons builder that generates `splash.gen.h`/
  `app_icon.gen.h` (embedded boot images) from the source PNGs at build
  time.

## Where to look for common tasks

| Task | Start here |
|---|---|
| Add a new command-line flag | `Main::setup()` argument parsing in `main.cpp`, and `Main::print_help()` for `--help` text |
| Change fixed-timestep/physics interpolation behavior | `main_timer_sync.cpp`, `Main::iteration()` |
| Add a new runtime performance monitor | `performance.h`/`.cpp` |
| Debug engine startup/shutdown ordering | `Main::setup()` → `Main::setup2()` → `Main::start()` → `Main::iteration()` → `Main::cleanup()`, in that order in `main.cpp` |
