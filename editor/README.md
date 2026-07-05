# editor/

`editor/` is the Godot editor application itself, built on top of `scene/`
(the editor UI is a Godot scene tree using `scene/gui` controls) and
`core/`/`servers/`. It only exists in editor builds — everything here is
compiled behind the `TOOLS_ENABLED` preprocessor define, which SCons adds
automatically when `target=editor` (see root `SConstruct`). Exported
games (`target=template_debug`/`template_release`) never link this code.

## Entry point

`editor_node.cpp`/`.h` defines `EditorNode`, the editor's root `Node` and
the closest thing to a "main window controller": it owns the main menu,
the docks, the viewport/2D/3D main screens, and orchestrates plugin
registration, scene loading, and the run/build/export flows. If you're
trying to understand how the editor boots or how a top-level piece of UI
gets created, start reading here. `editor_data.h` holds the in-memory
state `EditorNode` manages (open scenes, undo/redo history per scene,
plugin instances).

## Plugin system

`plugins/editor_plugin.h` defines `EditorPlugin`, the extension point for
adding editor functionality (custom inspectors, main-screen tabs, import
plugins, gizmos, etc.) — both built-in editor features (see the many
`*_editor_plugin.cpp` files scattered under other subdirectories) and
user/addon plugins (GDScript/C# scripts under `res://addons/`, or
GDExtension) are implemented as `EditorPlugin` subclasses. Key hooks:
`_enter_tree`/`_exit_tree` (register/unregister), `_edit`/`_handles`
(which resource/node types the plugin edits), `_has_main_screen`/
`_make_visible` (adds a top-level tab like 2D/3D/Script), `_forward_*_gui_input`
(scene viewport input interception for custom gizmos/tools).
`editor_plugin_settings.cpp` is the dock listing installed addon plugins;
`plugin_config_dialog.h` handles the new-plugin scaffold dialog.

## Docks and inspector

- **`docks/`** — The dockable side panels: `FileSystemDock`,
  `SceneTreeDock`, `InspectorDock`, `SignalsDock` (Node signal
  connections), `GroupsDock`, `HistoryDock` (undo/redo). `EditorDock`
  (`editor_dock.h`) is the common base; `EditorDockManager` handles
  docking/floating/layout persistence.
- **`inspector/`** — `EditorInspector` (`editor_inspector.h`) renders a
  `ClassDB`-described object's properties as editable UI, dispatching per
  property-type to `EditorProperty` widgets (`editor_properties.h`,
  `editor_properties_array_dict.h`, `editor_properties_vector.h`).
  `EditorResourcePicker`/`EditorResourcePreview` handle resource-typed
  property widgets and thumbnail generation. `multi_node_edit.h` powers
  editing a property across multiple selected nodes at once.

## Importer pipeline

`import/` holds `EditorImportPlugin` (`editor_import_plugin.h`), the base
class for turning a source asset on disk into an imported `.import`
resource, plus the built-in importers: `ResourceImporterImage`,
`ResourceImporterDynamicFont`, `ResourceImporterBMFont`,
`ResourceImporterCSVTranslation`, layered/atlas texture importers, and the
`3d/` subdirectory for 3D scene import (glTF/FBX pipeline, retargeting,
`FBXImporterManager`). `import_dock.h` (under `docks/`) is the UI that
shows/edits import settings for the currently selected file.
`file_system/` (`FileSystemDock`'s backing model) tracks which files need
(re-)importing and drives the import queue.

## EditorSettings and configuration

`settings/editor_settings.h` — `EditorSettings`, the per-user editor
preferences singleton (distinct from `ProjectSettings`, which is
per-project and lives in `core/config/`). Related UI: `project_settings_editor.h`
(project-level settings dialog), `editor_settings_dialog.h`
(user-level preferences dialog), `editor_autoload_settings.h` (autoload
singleton config), `editor_feature_profile.h`/`editor_build_profile.h`
(restricting which editor features/classes are available, used for
minimal/education-focused editor builds), `action_map_editor.h` +
`input_event_configuration_dialog.h` (input map editing).

## Other subdirectories

- **`export/`** — Export pipeline: per-platform export templates/
  presets, PCK packing.
- **`scene/`** — Editor-side scene editing helpers: 2D/3D viewport editors,
  gizmos, `CanvasItemEditor`/`Node3DEditor`.
- **`script/`** — Script editor (text editing, the GDScript editor
  integration for autocompletion/diagnostics — see also
  `modules/gdscript/language_server/`).
- **`debugger/`** — Editor-side remote debugger UI (connects to the
  running game via the protocol implemented in `core/debugger/` and
  `scene/debugger/`).
- **`animation/`** — Animation track editor (keyframe editing UI for
  `AnimationPlayer`).
- **`shader/`** — Shader editor and visual shader graph editor.
- **`file_system/`**, **`gui/`**, **`themes/`**, **`icons/`** — Filesystem
  model, editor-specific widgets, editor theme generation, and built-in
  editor icons.
- **`asset_library/`** — In-editor asset store browser.
- **`project_manager/`** — The standalone project-list window shown before
  a project is opened.
- **`version_control/`** — VCS plugin interface (e.g. Git integration via
  a `EditorVCSInterface` plugin).
- **`doc/`** — In-editor class reference viewer (renders `doc/classes/*.xml`).

## Where to look for common tasks

| Task | Start here |
|---|---|
| Add a new editor plugin/tool | `plugins/editor_plugin.h`, register via `EditorNode::add_editor_plugin` or an addon's `plugin.cfg` |
| Add a custom inspector property widget | `inspector/editor_properties.h`, register an `EditorInspectorPlugin` |
| Add a new asset importer | `import/editor_import_plugin.h`, follow an existing `ResourceImporter*` |
| Add/modify a dock | `docks/`, `EditorDockManager` |
| Change editor preferences/UI | `settings/editor_settings.h`, `settings/editor_settings_dialog.h` |
| Editor startup / window layout | `editor_node.cpp` |
