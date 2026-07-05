# modules/godot_physics_2d/

Godot Physics 2D — the engine's built-in, dependency-free 2D physics
implementation. It implements the abstract `PhysicsServer2D` interface
(`servers/physics_server_2d.h`) end to end: broadphase, narrowphase collision,
constraint solving, and the `Godot*2D` collision object hierarchy (`Body`,
`Area`, `StaticBody` equivalents at the server level).

This is the default 2D physics backend; there is no alternative engine choice
for 2D the way Jolt is offered as an alternative to Godot Physics in 3D (see
[`modules/godot_physics_3d/README.md`](../godot_physics_3d/README.md)).

## Server entry point

- `godot_physics_server_2d.h` / `.cpp` — `GodotPhysicsServer2D`, the concrete
  implementation of `PhysicsServer2D`. This is what `servers/physics_server_2d.h`
  callers (`RigidBody2D`, `Area2D`, `CharacterBody2D`, etc., in `scene/`)
  ultimately talk to via RID-based server calls. Registered as the 2D physics
  backend in `register_types.cpp`.

## Collision objects

- `godot_collision_object_2d.h` — `GodotCollisionObject2D`, base class shared
  by bodies and areas; owns the set of `GodotShape2D` shapes attached to a
  physics object and its transform.
- `godot_body_2d.h` / `.cpp` — `GodotBody2D`, rigid/kinematic/static body
  physics state: mass, velocity, applied forces, sleep state.
- `godot_body_direct_state_2d.h` — `PhysicsDirectBodyState2D` implementation,
  what a `_integrate_forces()` callback receives.
- `godot_area_2d.h` / `.cpp` — `GodotArea2D`, non-colliding volumes used for
  overlap detection, gravity/damping overrides, and audio areas.
- `godot_shape_2d.h` / `.cpp` — `GodotShape2D` and its concrete shapes
  (circle, rectangle, capsule, convex polygon, segment, etc.), each providing
  support-point and AABB queries used by the narrowphase.

## Broadphase and space

- `godot_broad_phase_2d.h` — Abstract broadphase interface: coarse AABB
  overlap detection that produces candidate pairs before narrowphase runs.
- `godot_broad_phase_2d_bvh.cpp` / `.h` — The BVH-based broadphase
  implementation (built on `core/math/bvh_tree.h`), the only broadphase
  backend currently registered via `GodotBroadPhase2D::create_func`.
- `godot_space_2d.h` / `.cpp` — `GodotSpace2D`, one simulation space (maps to
  a `World2D`). Owns the broadphase, the active/sleeping body lists, solver
  parameters (bias, sleep thresholds, iteration counts), and drives
  `test_body_motion` used by `CharacterBody2D` move-and-slide.

## Narrowphase and constraint solving

- `godot_collision_solver_2d.h` / `.cpp` — Narrowphase dispatch: given two
  shapes and their transforms, produces contact points or a boolean overlap
  result.
- `godot_collision_solver_2d_sat.cpp` / `.h` — Separating Axis Theorem solver,
  the concrete algorithm behind most shape-pair collision tests.
- `godot_area_pair_2d.h` / `.cpp`, `godot_body_pair_2d.h` / `.cpp` — Per-pair
  constraint objects created by the broadphase pair callback; hold persistent
  contact/overlap state across simulation steps.
- `godot_constraint_2d.h` — Base class for anything solved iteratively each
  step (contact pairs and joints).
- `godot_joints_2d.h` / `.cpp` — Joint constraints (pin, groove, damped
  spring) implementing `PhysicsServer2D::JointType`.
- `godot_step_2d.h` / `.cpp` — `GodotStep2D`, drives one full simulation
  step: island generation, constraint setup, iterative solve, and velocity
  integration, in that order (see `GodotSpace2D::ElapsedTime` for the exact
  phase breakdown used by the profiler).

## Notes

- Class names are prefixed `Godot*2D` to distinguish this backend's internal
  types from the abstract `servers/physics_server_2d.h` API and from other
  physics backends.
- Can be disabled at build time via the `disable_physics_2d` SCons option
  (see `config.py`); with it disabled, no 2D physics backend is compiled in.
