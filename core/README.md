# core/

`core/` is the foundation layer of the Godot engine. It has no dependency on
`scene/`, `servers/`, or any platform/driver code — everything else in the
engine builds on top of it. If you are adding a new engine class, writing a
GDExtension, or just trying to understand how Godot's object/type system
works, this is the place to start.

## Object model

`Object` → `RefCounted` → `Resource` is the core inheritance chain used
almost everywhere in the engine and in scripting.

- **`Object`** (`object/object.h`) — The base class for anything that
  participates in Godot's reflection system: properties, methods, signals,
  and notifications. Every `Object` is registered with `ClassDB`
  (`object/class_db.h`), which is what allows GDScript, C#, and GDExtension
  to introspect and call into engine types at runtime. Objects are *not*
  reference-counted by default; they must be freed manually (`memdelete` or
  `queue_free()` at the `Node` level).
- **`RefCounted`** (`object/ref_counted.h`) — Adds atomic reference counting
  on top of `Object`. Most scripting-facing types that don't need manual
  lifetime management (e.g. most `Resource` subclasses) derive from this
  instead of `Object` directly. Use the `Ref<T>` smart pointer
  (`object/ref_counted.h`) to hold references.
- **`Resource`** — Adds serialization: path tracking, duplication, and
  integration with the `.tres`/`.res` save/load pipeline. Resources are the
  data-carrying building blocks of scenes (materials, meshes, scripts,
  shaders, etc.). Lives in `core/io/resource*.h` and `core/io/resource_*`
  (loader/saver/format-related files).

Other object-model files worth knowing:

- `object/class_db.h` — Class registration, method binding
  (`ClassDB::bind_method`), property binding (`ADD_PROPERTY`), and signal
  declarations (`ADD_SIGNAL`). This is the mechanism new engine classes hook
  into (see the root `CLAUDE.md` "New engine class" section for the steps).
- `object/method_bind.h`, `object/method_info.h`, `object/property_info.h` —
  Metadata describing bound methods, arguments, and properties, used by
  `ClassDB` and by GDExtension's C ABI.
- `object/script_language.h`, `object/script_instance.h` — Interfaces that
  let scripting languages (GDScript, C#, GDExtension) attach behavior to an
  `Object` instance.
- `object/worker_thread_pool.h` — Engine-wide thread pool used for
  parallelizable background work (import, shader compilation, etc.).
- `object/message_queue.h` — Deferred method call queue (`call_deferred`).
- `object/undo_redo.h` — Generic undo/redo stack used by the editor.

## Variant

`variant/variant.h` defines `Variant`, Godot's dynamic value type. Every
value that crosses the scripting boundary (GDScript locals, exported
properties, signal arguments, `ClassDB`-bound method arguments/returns) is a
`Variant`. It's a tagged union over all built-in types: primitives (`bool`,
`int`, `float`), math types (`Vector2/3/4`, `Transform2D/3D`, `Color`, ...),
containers (`Array`, `Dictionary`), strings, `Object*`/`Ref<RefCounted>`,
and more.

Related files:

- `variant/variant_op.h` / `variant_op.cpp` — Operators between variant
  types (`+`, `==`, etc.), what makes `Variant a = 1; Variant b = "1"` a
  well-defined (or rejected) comparison.
- `variant/variant_call.cpp`, `variant/variant_utility.cpp` — Built-in
  method dispatch on variants (e.g. `String.length()`, `Array.append()`)
  and global utility functions exposed to GDScript (`@GlobalScope`
  functions like `abs()`, `lerp()`).
- `variant/variant_construct.h`, `variant/variant_destruct.h` — Construction
  and destruction tables for the internal union.
- `variant/callable.h`, `variant/callable_bind.h` — `Callable`, used for
  signal connections and any place a first-class function reference is
  needed.
- `variant/array.h`, `variant/dictionary.h`, `variant/typed_array.h` —
  `Array`/`Dictionary` and their typed variants (`Array[int]` etc. in
  GDScript).

## ClassDB registration

`ClassDB` (`object/class_db.h`) is the registry that makes an `Object`
subclass visible to the rest of the engine and to scripts. Registration
happens once per module/subsystem in a `register_types.cpp`
(`ClassDB::register_class<MyClass>()`), and exposure of methods/properties/
signals happens in the class's own `.cpp` via a static `_bind_methods()`.
See the root `CLAUDE.md` for the exact macro incantations
(`bind_method`, `ADD_PROPERTY`, `ADD_SIGNAL`).

## String and container types

- `string/ustring.h` — `String`, Godot's Unicode string type (UTF-32
  internally). Used pervasively instead of `std::string`.
- `string/string_name.h` — `StringName`, an interned/hashed string used for
  fast repeated comparisons (property names, signal names, node names).
  Prefer `StringName` over `String` for anything compared often (e.g.
  `SNAME("my_signal")`).
- `string/node_path.h` — `NodePath`, a parsed path used to address nodes
  within a scene tree.
- `string/translation.h`, `string/translation_server.h` — Localization.
- `templates/` — Godot's own container library, used instead of STL
  throughout the engine: `Vector<T>` (COW array, `templates/vector.h`),
  `LocalVector<T>` (non-COW, `templates/local_vector.h`), `HashMap`,
  `HashSet`, `List`, `RBMap`/`RBSet` (red-black tree map/set), `RID` /
  `RID_Owner` (opaque server-side resource handles used by the `servers/`
  layer).

## I/O abstraction

- `io/file_access.h` — `FileAccess`, the abstract interface for reading and
  writing files. Concrete backends include plain filesystem access,
  in-memory buffers (`file_access_memory.h`), compressed streams
  (`file_access_compressed.h`), encrypted streams
  (`file_access_encrypted.h`), and `.pck`/zip package access
  (`file_access_pack.h`, `file_access_zip.h`). Platform layers provide the
  concrete filesystem implementation.
- `io/dir_access.h` — Directory listing/traversal abstraction, mirrors
  `FileAccess`'s per-platform-backend pattern.
- `io/resource_loader.h` / `io/resource_saver.h` (see `io/` listing) — The
  `.tres`/`.res`/binary resource load/save pipeline, format recognizers,
  and importer hookup.
- `io/json.h`, `io/marshalls.h`, `io/config_file.h` — Serialization formats
  used by the engine (JSON, binary variant marshalling, INI-style config).
- `io/http_client.h` — Low-level HTTP client used by `HTTPRequest` and
  friends.

## OS layer

- `os/os.h` — `OS`, the abstract interface each platform (`platform/windows`,
  `platform/linuxbsd`, `platform/macos`, `platform/android`, `platform/ios`,
  `platform/web`, ...) implements to provide process/window/clipboard/time
  primitives to the rest of the engine.
- `os/thread.h`, `os/mutex.h`, `os/semaphore.h`, `os/rw_lock.h`,
  `os/condition_variable.h`, `os/spin_lock.h` — Cross-platform threading
  primitives used throughout `core/`, `servers/`, and `scene/`.
- `os/main_loop.h` — `MainLoop`, the interface `SceneTree`
  (`scene/main/scene_tree.h`) implements; `main/main.cpp` drives it.
- `os/memory.h` — Custom allocators (`memalloc`/`memfree`, `memnew`/
  `memdelete`) used instead of raw `new`/`delete` engine-wide.
- `os/time.h` — Date/time and high-resolution timing utilities.

## Other subsystems in `core/`

- `math/` — Vector/matrix/geometry math (`Vector2/3/4`, `Basis`,
  `Transform2D/3D`, `Quaternion`, `AABB`, `Plane`, `Color`), plus spatial
  acceleration structures (`bvh_tree.h`, `dynamic_bvh.h`) and general-purpose
  algorithms (`geometry_2d.h`/`geometry_3d.h`, `a_star.h` pathfinding).
- `config/` — `ProjectSettings` and `Engine` singleton (global engine state,
  versioning, frame timing).
- `extension/` — GDExtension: the C ABI (`gdextension_interface.h`,
  generated — do not hand-edit) that lets external native code register
  classes into `ClassDB` without recompiling the engine.
- `crypto/` — Hashing, AES, and crypto resource wrappers (`Crypto`,
  `HashingContext`).
- `debugger/` — Remote debugger protocol used by the editor to talk to a
  running game (breakpoints, profiling, live inspection).
- `input/` — `Input` singleton, `InputEvent` hierarchy, `InputMap` action
  mapping, controller mapping databases.
- `error/` — `ERR_FAIL_*` / `CRASH_*` macros used for error handling and
  assertions engine-wide.
- `profiling/` — Lightweight engine-internal profiling hooks.

## File map — most important headers

| Header | Purpose |
|---|---|
| `object/object.h` | `Object` base class, signals, notifications, `ClassDB` registration entry point |
| `object/ref_counted.h` | `RefCounted`, `Ref<T>` smart pointer |
| `object/class_db.h` | Class/method/property/signal registration |
| `variant/variant.h` | `Variant` dynamic value type |
| `variant/callable.h` | `Callable`, used for signals and deferred calls |
| `string/ustring.h` | `String` |
| `string/string_name.h` | `StringName` (interned string) |
| `templates/vector.h` | `Vector<T>`, the engine's COW array |
| `templates/hash_map.h` | `HashMap<K, V>` |
| `io/file_access.h` | `FileAccess`, file I/O abstraction |
| `io/dir_access.h` | `DirAccess`, directory traversal abstraction |
| `os/os.h` | `OS`, per-platform system services abstraction |
| `os/main_loop.h` | `MainLoop`, base of `SceneTree` |
| `os/memory.h` | Engine allocators (`memnew`/`memdelete`) |
| `error/error_macros.h` | `ERR_FAIL_*`/`CRASH_*` error-handling macros |
