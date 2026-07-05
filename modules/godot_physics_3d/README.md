# modules/godot_physics_3d/

Godot Physics 3D — the engine's built-in, dependency-free 3D physics
implementation. It implements the abstract `PhysicsServer3D` interface
(`servers/physics_server_3d.h`): broadphase, GJK/EPA-based narrowphase
collision, constraint/joint solving, and soft bodies.

Structurally this mirrors
[`modules/godot_physics_2d/README.md`](../godot_physics_2d/README.md) one
dimension up — same broadphase/space/step architecture, `Godot*3D` naming.

## Relationship to Jolt Physics

Unlike 2D, 3D physics has two selectable backends:

- **Godot Physics 3D** (this module) — always available, no external
  dependency, used by default.
- **Jolt Physics** (`modules/jolt_physics/`) — wraps the third-party Jolt
  library (`thirdparty/jolt/`); generally offers better performance and
  stability for complex rigid-body scenes and is the recommended backend for
  projects with heavy physics use.

Both implement the same `PhysicsServer3D` interface, so `RigidBody3D`,
`CharacterBody3D`, `Area3D`, etc. in `scene/` work identically regardless of
which is active. The backend is chosen via the `physics/3d/physics_engine`
project setting (`DEFAULT`/`GodotPhysics3D`/`Jolt`). Both modules can be
compiled in simultaneously; the setting only affects which one is
instantiated at runtime.

## Server entry point

- `godot_physics_server_3d.h` / `.cpp` — `GodotPhysicsServer3D`, the concrete
  `PhysicsServer3D` implementation. Registered as a physics backend in
  `register_types.cpp`.

## Collision objects

- `godot_collision_object_3d.h` — `GodotCollisionObject3D`, base class for
  bodies and areas; owns attached `GodotShape3D` shapes and transform.
- `godot_body_3d.h` / `.cpp` — `GodotBody3D`, rigid/kinematic/static body
  state (mass, inertia tensor, velocities, sleep state).
- `godot_body_direct_state_3d.h` — `PhysicsDirectBodyState3D` implementation
  passed to `_integrate_forces()`.
- `godot_area_3d.h` / `.cpp` — `GodotArea3D`, non-colliding overlap/gravity
  volumes.
- `godot_soft_body_3d.h` / `.cpp` — `GodotSoftBody3D`, mass-spring soft-body
  simulation (cloth, deformable meshes), distinct from the rigid-body solver
  path.
- `godot_shape_3d.h` / `.cpp` — `GodotShape3D` and concrete shapes (sphere,
  box, capsule, cylinder, convex hull, concave/trimesh, heightmap).

## Broadphase and space

- `godot_broad_phase_3d.h` — Abstract broadphase interface.
- `godot_broad_phase_3d_bvh.cpp` / `.h` — BVH-based broadphase implementation
  (built on `core/math/bvh_tree.h`), the registered backend.
- `godot_space_3d.h` / `.cpp` — `GodotSpace3D`, one simulation space (maps to
  a `World3D`). Owns broadphase, active body lists, solver parameters, and
  `test_body_motion` used by `CharacterBody3D`.

## Narrowphase and constraint solving

- `gjk_epa.h` / `.cpp` — GJK (Gilbert-Johnson-Keerthi) distance algorithm and
  EPA (Expanding Polytope Algorithm) penetration-depth computation, the core
  primitives behind convex-convex narrowphase collision.
- `godot_collision_solver_3d.h` / `.cpp` — Narrowphase dispatch across shape
  pairs.
- `godot_collision_solver_3d_sat.cpp` / `.h` — SAT-based solver used for
  primitive shape pairs (box-box, box-sphere, etc.) as a faster path than
  GJK/EPA.
- `godot_area_pair_3d.h` / `.cpp`, `godot_body_pair_3d.h` / `.cpp` —
  Per-pair persistent constraint/contact state, created via the broadphase
  pair callback.
- `godot_constraint_3d.h` — Base class for iteratively-solved constraints
  (contacts and joints).
- `godot_joint_3d.h` + `joints/` — Joint constraints (pin, hinge, slider,
  cone twist, generic 6DOF) implementing `PhysicsServer3D::JointType`.
- `godot_step_3d.h` / `.cpp` — `GodotStep3D`, drives one simulation step:
  island generation, constraint setup, iterative solve, velocity
  integration.

## Notes

- Can be disabled at build time via the `disable_physics_3d` SCons option
  (see `config.py`).
