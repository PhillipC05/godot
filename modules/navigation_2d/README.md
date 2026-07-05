# modules/navigation_2d/

Godot's built-in 2D navigation implementation — navmesh baking, pathfinding,
and RVO-based avoidance for `Navigation2DServer`. It implements the abstract
`NavigationServer2D` interface (`servers/navigation_2d/navigation_server_2d.h`):
map/region/link management, polygon-based navmesh generation, corridor
pathfinding, and local avoidance for agents.

Structurally this mirrors
[`modules/navigation_3d/README.md`](../navigation_3d/README.md) one dimension
down — same map/region/agent/obstacle architecture, `Nav*2D` naming, and
command-buffer style server implementation.

## Relationship to NavigationServer2D

`NavigationServer2D` (`servers/navigation_2d/navigation_server_2d.h`) is a
pluggable-backend singleton managed by `NavigationServer2DManager`, which also
provides a no-op dummy backend (`navigation_server_2d_dummy.h`) used when no
real backend is registered. This module registers itself as the default:

```cpp
NavigationServer2DManager::get_singleton()->register_server(
    "GodotNavigation2D", callable_mp_static(_createGodotNavigation2DCallback));
NavigationServer2DManager::get_singleton()->set_default_server("GodotNavigation2D");
```

`GodotNavigationServer2D` implements every `NavigationServer2D` virtual method
via a `COMMAND_n` macro pattern: calls queue `_cmd_*` functions that execute
during a synchronization phase, the same command-buffer approach used by
`modules/godot_physics_2d/`. `NavigationAgent2D`, `NavigationRegion2D`, etc. in
`scene/` work against the abstract interface regardless of which backend is
active.

## Server entry point

- `2d/godot_navigation_server_2d.h` / `.cpp` — `GodotNavigationServer2D`, the
  concrete `NavigationServer2D` implementation. Registered as the default
  navigation backend in `register_types.cpp`.

## Maps, regions, and links

- `nav_map_2d.h` / `.cpp` — `NavMap2D`, one navigation "world" (maps to a
  `World2D`); owns regions, links, agents, and obstacles, and drives the
  per-frame sync/update step.
- `nav_region_2d.h` / `.cpp` — `NavRegion2D`, a baked navmesh region within a
  map.
- `nav_link_2d.h` / `.cpp` — `NavLink2D`, a point-to-point custom connection
  between otherwise disconnected navmesh areas (e.g. for jumps or teleports).
- `nav_base_2d.h` — Shared base for objects that belong to a map (regions,
  links), tracking enabled state and map ownership.
- `2d/nav_map_builder_2d.h` / `.cpp`, `2d/nav_region_builder_2d.h` / `.cpp` —
  Build/rebuild immutable iteration snapshots from raw map/region source data.
- `2d/nav_map_iteration_2d.h`, `2d/nav_region_iteration_2d.h`,
  `2d/nav_base_iteration_2d.h` — Immutable snapshot structs consumed by
  queries; this read/write split keeps pathfinding queries thread-safe while
  the map is rebuilt.

## Pathfinding and navmesh generation

- `2d/nav_mesh_queries_2d.h` / `.cpp` — `NavMeshQueries2D`, corridor-funnel
  pathfinding and geometry queries (closest point, ray/segment queries) over
  baked navmesh polygon data.
- `2d/nav_mesh_generator_2d.h` / `.cpp` — `NavMeshGenerator2D`, bakes
  `NavigationPolygon` source geometry into navmesh polygons using Clipper2
  boolean/merge operations (guarded by `CLIPPER2_ENABLED`).
- `nav_utils_2d.h` — Shared math/geometry helper types used across map
  building and queries.
- `triangle2.h` / `.cpp` — 2D triangle utility used by navmesh triangulation.

## Avoidance

- `nav_agent_2d.h` / `.cpp` — `NavAgent2D`, a pathfinding + local-avoidance
  agent; wraps an `RVO2D::Agent2d` from `thirdparty/rvo2/rvo2_2d/` for
  reciprocal velocity obstacle avoidance.
- `nav_obstacle_2d.h` / `.cpp` — `NavObstacle2D`, static or dynamic obstacles
  that feed into agents' RVO avoidance computation.
- `nav_rid_2d.h` — `RID_Owner`-style base for navigation object handles.

## Editor integration

- `editor/` — Editor plugins and gizmos for `NavigationRegion2D`,
  `NavigationLink2D`, and `NavigationObstacle2D`, compiled only for editor
  builds.

## Notes

- Can be disabled at build time via the `disable_navigation_2d` SCons option
  (see `config.py`).
- The RVO2D avoidance sources in `thirdparty/rvo2/rvo2_2d/` are shared with
  `modules/navigation_3d/`, which embeds a planar `RVO2D::Agent2d` for its own
  3D agents; `navigation_3d/SCsub` skips recompiling those sources when this
  module is also enabled, to avoid duplicate symbols.
