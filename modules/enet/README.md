# modules/enet/

A thin wrapper around the [ENet](http://enet.bespin.org/) UDP networking
library (`thirdparty/enet/`), providing a `MultiplayerPeer` implementation
for use with the high-level multiplayer API
([`modules/multiplayer/README.md`](../multiplayer/README.md)), plus
lower-level `ENetConnection`/`ENetPacketPeer` classes for direct use.

ENet provides reliable-UDP semantics (optional reliability, ordering, and
sequencing per channel) without TCP's head-of-line blocking, which is why
it's Godot's default peer-to-peer transport for native (non-web) multiplayer
games.

## Multiplayer peer

- `enet_multiplayer_peer.h` / `.cpp` — `ENetMultiplayerPeer`, the
  `MultiplayerPeer` implementation exposed to scripts as
  `ENetMultiplayerPeer`. Supports three topologies:
  - `create_server()` — host listens for incoming client connections.
  - `create_client()` — connect to a listening server.
  - `create_mesh()` / `add_mesh_peer()` — direct peer-to-peer mesh, each
    node connects to every other node individually (no relay server).

  Internally multiplexes reliable/unreliable traffic across ENet channels
  (`SYSCH_RELIABLE`/`SYSCH_UNRELIABLE`) and manages per-peer connect/disconnect
  system messages (`SYSMSG_ADD_PEER`/`SYSMSG_REMOVE_PEER`).

## Lower-level wrappers

- `enet_connection.h` / `.cpp` — `ENetConnection`, wraps an ENet `host`:
  socket creation, connect/service/flush, bandwidth limits, compression mode.
  Exposed to scripts for use cases that don't need the full multiplayer API
  (custom protocols over raw ENet).
- `enet_packet_peer.h` / `.cpp` — `ENetPacketPeer`, wraps a single ENet
  `peer` (one connection) as a `PacketPeer`, with per-channel send/receive
  and configurable timeout/throttle parameters.

## Notes

- DTLS (encrypted ENet) is supported by pairing an `ENetConnection` with the
  engine's `core/io/packet_peer_dtls.h` layer; see
  `set_refuse_new_connections()` overrides in `ENetMultiplayerPeer` for where
  DTLS server instrumentation hooks in.
- Not available on the Web platform — WebRTC/WebSocket
  (see [`modules/webrtc/README.md`](../webrtc/README.md),
  [`modules/websocket/README.md`](../websocket/README.md)) are the browser
  equivalents, since raw UDP sockets aren't available there.
