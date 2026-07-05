# modules/websocket/

WebSocket client and server implementation, exposed to scripts as
`WebSocketPeer` (client) and used internally by `WebSocketMultiplayerPeer`
for a `MultiplayerPeer` backend
(see [`modules/multiplayer/README.md`](../multiplayer/README.md)). Commonly
used for signaling servers (pairing with
[`modules/webrtc/README.md`](../webrtc/README.md)), lightweight client-server
games, and the engine's own remote debugger transport on Web.

## Core class

- `websocket_peer.h` / `.cpp` — `WebSocketPeer`, a `PacketPeer` over one
  WebSocket connection. `connect_to_url()` for client use, `accept_stream()`
  to upgrade an existing `StreamPeer` (e.g. from a `TCPServer` accept) to a
  server-side connection. Supports text vs binary frames (`WriteMode`),
  configurable buffer sizes, heartbeat interval, and sub-protocol/handshake
  header negotiation. Concrete instances are produced through the
  `WebSocketPeer::create()` factory, backed by a platform-specific
  implementation registered at startup.

## Implementations

- `wsl_peer.h` / `.cpp` — "WebSocket Library" backend used on native
  (non-web) platforms: implements the WebSocket handshake and framing
  directly over a `StreamPeerTCP`/`StreamPeerTLS`, no external dependency.
- `emws_peer.h` / `.cpp` — Emscripten backend for Web exports: bridges to
  the browser's native `WebSocket` JS object via `library_godot_websocket.js`,
  since browsers don't allow raw TCP socket access.
- `packet_buffer.h` — Ring-buffer helper used by both backends to queue
  framed packets between the network thread/callback and the consumer.

## Multiplayer peer

- `websocket_multiplayer_peer.h` / `.cpp` — `WebSocketMultiplayerPeer`,
  adapts a set of `WebSocketPeer` connections (client, or server with
  multiple accepted clients) into a `MultiplayerPeer`.

## Editor and debugger integration

- `editor/` — Editor-side WebSocket plugin support.
- `remote_debugger_peer_websocket.cpp` / `.h` — Lets the remote debugger
  protocol (`core/debugger/`) run over WebSocket, which is required for Web
  exports since a Web-exported game can't open a raw TCP debugger socket.

## Notes

- `WSLPeer` and `EMWSPeer` implement the exact same `WebSocketPeer`
  interface, so calling code never branches on platform.
