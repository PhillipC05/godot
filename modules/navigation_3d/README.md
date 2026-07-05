# modules/navigation_3d/

Godot's built-in 3D navigation implementation — Recast-based navmesh baking,
corridor pathfinding, and RVO-based avoidance for `NavigationServer3D`. It
implements the abstract `NavigationServer3D` interface
(`servers/navigation_3d/navigation_server_3d.h`): map/region/link management,
navmesh generation, pathfinding, and local avoidance for agents.

Structurally this mirrors
[`modules/navigation_2d/README.md`](../navigation_2d/README.md) one dimension
up — same map/region/agent/obstacle architecture, `Nav*3D` naming, and
command-buffer style server implementation.

## Relationship to NavigationServer3D

`NavigationServer3D` (`servers/navigation_3d/navigation_server_3d.h`) is a
pluggable-backend singleton managed by `NavigationServer3DManager`, which also
provides a no-op dummy backend (`navigation_server_3d_dummy.h`) used when no
real backend is registered. This module registers itself as the default:

```cpp
NavigationServer3DManager::get_singleton()->register_server(
    "GodotNavigation3D", callable_mp_static(_createGodotNavigation3DCallback));
NavigationServer3DManager::get_singleton()->set_default_server("GodotNavigation3D");
```

`GodotNavigationServer3D` implements every `NavigationServer3D` virtual method
via a `COMMAND_n` macro pattern: calls queue `_cmd_*` functions that execute
during a synchronization phase, the same command-buffer approach used by
`modules/godot_physics_3d/`. `NavigationAgent3D`, `NavigationRegion3D`, etc. in
`scene/` work against the abstract interface regardless of which backend is
active.

Baking navmeshes from level geometry additionally has a documented dependency
on the `csg` and `gridmap` modules (declared in `config.py` via
`module_add_dependencies`), since `NavigationMesh` source geometry can be
parsed from CSG shapes and GridMap tiles.

## Server entry point

- `3d/godot_navigation_server_3d.h` / `.cpp` — `GodotNavigationServer3D`, the
  concrete `NavigationServer3D` implementation. Registered as the default
  navigation backend in `register_types.cpp`.

## Maps, regions, and links

- `nav_map_3d.h` / `.cpp` — `NavMap3D`, one navigation "world" (maps to a
  `World3D`); owns regions, links, agents, and obstacles, and drives the
  per-frame sync/update step.
- `nav_region_3d.h` / `.cpp` — `NavRegion3D`, a baked navmesh region within a
  map.
- `nav_link_3d.h` / `.cpp` — `NavLink3D`, a point-to-point custom connection
  between otherwise disconnected navmesh areas (e.g. for jumps, elevators, or
  teleports).
- `nav_base_3d.h` — Shared base for objects that belong to a map (regions,
  links), tracking enabled state and map ownership.
- `3d/nav_map_builder_3d.h` / `.cpp`, `3d/nav_region_builder_3d.h` / `.cpp` —
  Build/rebuild immutable iteration snapshots from raw map/region source data.
- `3d/nav_map_iteration_3d.h`, `3d/nav_region_iteration_3d.h`,
  `3d/nav_base_iteration_3d.h` — Immutable snapshot structs consumed by
  queries; this read/write split keeps pathfinding queries thread-safe while
  the map is rebuilt.

## Pathfinding and navmesh generation

- `3d/nav_mesh_queries_3d.h` / `.cpp` — `NavMeshQueries3D`, corridor-funnel
  pathfinding and geometry queries (closest point, ray/segment queries) over
  baked navmesh polygon data.
- `3d/nav_mesh_generator_3d.h` / `.cpp` — `NavMeshGenerator3D`, bakes
  `NavigationMesh` source geometry into a navmesh by voxelizing and
  rasterizing it via recastnavigation (`thirdparty/recastnavigation/Recast/`).
- `3d/navigation_mesh_generator.h` / `.cpp` — `NavigationMeshGenerator`,
  a deprecated `Engine` singleton wrapper kept for API compatibility; removed
  when built with `disable_deprecated`.
- `nav_utils_3d.h` — Shared math/geometry helper types used across map
  building and queries.

## Avoidance

- `nav_agent_3d.h` / `.cpp` — `NavAgent3D`, a pathfinding + local-avoidance
  agent. Notably it embeds **both** an `RVO2D::Agent2d`
  (`thirdparty/rvo2/rvo2_2d/`) for planar avoidance and an `RVO3D::Agent3d`
  (`thirdparty/rvo2/rvo2_3d/`) for full 3D avoidance, so agents can be
  configured to avoid only along the horizontal plane or in all three
  dimensions.
- `nav_obstacle_3d.h` / `.cpp` — `NavObstacle3D`, static or dynamic obstacles
  that feed into agents' RVO avoidance computation.
- `nav_rid_3d.h` — `RID_Owner`-style base for navigation object handles.

## Editor integration

- `editor/` — Editor plugins and gizmos for `NavigationRegion3D`,
  `NavigationLink3D`, and `NavigationObstacle3D`, compiled only for editor
  builds.

## Notes

- Can be disabled at build time via the `disable_navigation_3d` SCons option
  (see `config.py`).
- `SCsub` skips recompiling the `thirdparty/rvo2/rvo2_2d/` sources needed for
  `NavAgent3D`'s embedded planar avoidance if
  [`modules/navigation_2d/`](../navigation_2d/README.md) is also enabled in
  the build, since that module already provides those symbols.
