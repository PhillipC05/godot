# modules/multiplayer/

The high-level multiplayer module: `SceneMultiplayer`, the default
implementation of `MultiplayerAPI` (`scene/main/multiplayer_api.h`), plus the
RPC/replication machinery that backs GDScript's `@rpc` annotation and the
`MultiplayerSpawner`/`MultiplayerSynchronizer` nodes.

This module implements the *protocol and API* layer; actual byte transport
comes from a `MultiplayerPeer` backend such as
[`modules/enet/README.md`](../enet/README.md) or
[`modules/webrtc/README.md`](../webrtc/README.md).

## Core class

- `scene_multiplayer.h` / `.cpp` — `SceneMultiplayer`. Holds the active
  `MultiplayerPeer`, tracks connected/authenticating peers, and dispatches
  incoming packets by command byte (`NetworkCommands`: remote call, path
  sync, spawn/despawn, raw, sys). Also defines `OfflineMultiplayerPeer`, a
  no-op peer used when no networking is active so `MultiplayerAPI` calls
  remain safe in single-player mode.
- Peer authentication (`send_auth`/`complete_auth`/`auth_callback`) lets a
  game validate a client before admitting it to the peer list — see
  `set_auth_callback()` and the `SYS_COMMAND_AUTH` system command.

## RPC dispatch

- `scene_rpc_interface.h` / `.cpp` — `SceneRPCInterface`. Resolves `@rpc`
  annotated method calls to wire format and back; enforces the
  authority/any-peer and reliable/unreliable/ordered transfer-mode rules
  declared on each RPC.
- `scene_cache_interface.h` / `.cpp` — `SceneCacheInterface`. Node paths are
  expensive to send repeatedly, so paths are cached per-peer on first use
  (`NETWORK_COMMAND_SIMPLIFY_PATH` / `CONFIRM_PATH`) and referenced by a
  short numeric ID afterward.

## State replication

- `scene_replication_interface.h` / `.cpp` — `SceneReplicationInterface`.
  Drives `MultiplayerSpawner` (remote instancing of scenes) and
  `MultiplayerSynchronizer` (periodic property sync) traffic.
- `multiplayer_spawner.h` / `.cpp` — `MultiplayerSpawner` node: authority
  spawns a scene locally, this replicates the spawn (and matching despawn)
  to peers.
- `multiplayer_synchronizer.h` / `.cpp` — `MultiplayerSynchronizer` node:
  declares a set of properties to keep synced from authority to peers, at a
  configurable replication interval.
- `scene_replication_config.h` / `.cpp` — `SceneReplicationConfig` resource,
  the property list a `MultiplayerSynchronizer` synchronizes, editable via
  the replication editor dock (`editor/`).

## Debugging

- `multiplayer_debugger.h` / `.cpp` — Feeds multiplayer bandwidth/RPC
  profiling data to the editor's remote debugger protocol
  (`core/debugger/`), backing the editor's "Network Profiler" panel.

## Tests

- `tests/` — Unit tests for the RPC and replication interfaces.

## See also

- `scene/main/multiplayer_api.h` — The abstract API this module implements.
- `scene/main/multiplayer_peer.h` — The abstract transport peer interface.
