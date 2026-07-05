# scene/

`scene/` is the main user-facing engine API — the layer that GDScript, C#,
and the editor build on. It defines the `Node` hierarchy, the `SceneTree`
that drives it, and the concrete node/resource types (sprites, meshes, GUI
controls, animation players, etc.) that make up a Godot scene. It sits on
top of `core/` (object model, Variant) and `servers/` (rendering, physics,
audio) — nodes are typically thin, high-level wrappers that translate scene
data into calls on the appropriate server.

## SceneTree and Node

- **`SceneTree`** (`main/scene_tree.h`/`.cpp`) — The root object that owns
  the running scene. It holds the tree of `Node`s under its `root`
  `Window`, drives the per-frame `_process`/`_physics_process` callbacks,
  dispatches input, manages groups (`add_to_group`/`call_group`), and
  handles scene switching (`change_scene_to_file`, `reload_current_scene`).
  `Main::iteration()` (`main/main.cpp`) calls into `SceneTree` once per
  frame.
- **`Node`** (`main/node.h`/`.cpp`) — The base class for everything that can
  live in the scene tree. Nodes form a parent/child hierarchy addressed by
  `NodePath`; every engine-level "object in the scene" (sprite, camera,
  control, audio player, ...) derives from `Node`. Key virtual callbacks,
  invoked via `_notification()`/`GDVIRTUAL`:
  - `_ready()` — called once after a node and all its children have
    entered the tree.
  - `_process(delta)` — called every rendered frame if processing is
    enabled (`set_process`).
  - `_physics_process(delta)` — called every physics tick
    (`set_physics_process`), for deterministic simulation code.
  - `_enter_tree()` / `_exit_tree()` — called when the node is added to or
    removed from a live `SceneTree`.
  These map to `Node::NOTIFICATION_READY`, `NOTIFICATION_PROCESS`,
  `NOTIFICATION_PHYSICS_PROCESS`, etc. (`main/node.h`), Godot's general
  notification mechanism (see `Object::_notification` in `core/`).
- **`Viewport`** / **`Window`** (`main/viewport.h`, `main/window.h`) — A
  `Viewport` is a rendering target and input-dispatch root; `Window` is a
  `Viewport` that also represents an OS window (or, embedded, a sub-window
  in the editor). `SceneTree::root` is a `Window`.
- **`CanvasItem`** (`main/canvas_item.h`) — Base class for anything drawn in
  2D screen/canvas space; both 2D nodes and GUI `Control`s derive from it,
  which is why 2D transforms and GUI layout share drawing/visibility
  plumbing.

## Signals

Nodes (like any `Object`) communicate via signals: declared with
`ADD_SIGNAL` in `_bind_methods()`, emitted with `emit_signal(SNAME(...))`,
and connected with `Node::connect()`/`Callable`. Signals are the standard
way for scene code to react to state changes (`Button::pressed`,
`Area2D::body_entered`, `AnimationPlayer::animation_finished`, ...) without
polling. See the root `CLAUDE.md` "New signal" section for the exact
binding steps.

## 2D vs 3D

Godot keeps 2D and 3D as separate, parallel node subtrees rather than
projecting one onto the other:

- **`2d/`** — `Node2D`-derived types: sprites, `Camera2D`, `Light2D`,
  `CollisionShape2D`, 2D particle systems, skeletons/IK for 2D, tilemaps
  layers, etc. Transforms are `Transform2D`.
- **`3d/`** — `Node3D`-derived types: meshes, `Camera3D`, lights, physics
  bodies/shapes, 3D particle systems, skeletons/IK, decals, etc. Transforms
  are `Transform3D`. Substantially larger than `2d/` because 3D rendering,
  physics, and animation retargeting (skeletons, IK modifiers) have more
  surface area.

Both subtrees ultimately drive the same abstract servers
(`RenderingServer`, `PhysicsServer2D`/`3D`) — see `servers/README.md`.

## Other subdirectories

- **`main/`** — Tree/window plumbing that isn't 2D- or 3D-specific:
  `Node`, `SceneTree`, `Viewport`, `Window`, `CanvasItem`, `CanvasLayer`,
  `Timer`, `HTTPRequest`, the multiplayer API/peer interfaces
  (`multiplayer_api.h`, `multiplayer_peer.h`), and `scene_tree_fti.*` (fixed
  timestep interpolation for physics-rate-independent rendering).
- **`animation/`** — `AnimationPlayer`/`AnimationMixer` (playback),
  `AnimationTree` + blend nodes/state machine (procedural animation
  blending), and `Tween` (property tweening).
- **`gui/`** — `Control`-derived UI widgets: buttons, containers/layout
  (`BoxContainer`, `GridContainer`, ...), `TextEdit`/`CodeEdit`, `Tree`,
  `RichTextLabel`, dialogs, `GraphEdit`/`GraphNode`, etc. This is both the
  in-game UI toolkit and the toolkit the editor itself is built with.
- **`resources/`** — `Resource` subclasses used by scenes: `Texture`
  variants, `Material`/`Shader`, `Mesh`, `Animation`, `Curve`, `StyleBox`,
  `Theme`, `PackedScene` (the `.tscn`/`.scn` serialized-scene format), plus
  2D/3D-specific resources in `resources/2d/` and `resources/3d/`.
- **`theme/`** — The default editor/UI theme: `Theme`/`ThemeDB`/
  `ThemeOwner` (theme property lookup and inheritance) and the generated
  default font/icon data (`default_theme_builders.py` generates the
  `*.gen.h` files from source assets).
- **`debugger/`** — Scene-side hooks for the remote debugger (scene tree
  inspection, live editing support).
- **`audio/`** — Scene-level audio helpers that sit above `AudioServer`.

## Where to look for common tasks

| Task | Start here |
|---|---|
| Add a new node type | `main/node.h` (base), pick `2d/` or `3d/` or `gui/` as the parent class, register in `register_scene_types.cpp` |
| Change how `_ready`/`_process` dispatch works | `main/node.cpp`, `main/scene_tree.cpp` |
| Add a new resource type (e.g. new texture format) | `resources/`, following an existing `Resource` subclass |
| Work on scene serialization (`.tscn`) | `resources/packed_scene.h`/`.cpp` |
| Work on the GUI toolkit | `gui/`, `theme/` |
| Work on animation blending | `animation/animation_tree.h`, `animation/animation_node_state_machine.h` |
