# modules/webrtc/

WebRTC peer connection and data channel support, exposed to scripts as
`WebRTCPeerConnection` / `WebRTCDataChannel`, plus a `MultiplayerPeer`
implementation (`WebRTCMultiplayerPeer`) for use with the high-level
multiplayer API ([`modules/multiplayer/README.md`](../multiplayer/README.md)).
This is the module that makes browser-to-browser (or browser-to-native)
peer-to-peer networking possible for Web exports.

## Abstract interfaces

- `webrtc_peer_connection.h` / `.cpp` — `WebRTCPeerConnection`, the abstract
  base: connection/gathering/signaling state machine, SDP offer/answer
  exchange (`create_offer`, `set_local_description`,
  `set_remote_description`), ICE candidate exchange (`add_ice_candidate`),
  and data channel creation (`create_data_channel`). Mirrors the browser
  `RTCPeerConnection` API by design, since SDP/ICE negotiation is normally
  done by application/signaling-server code that then feeds the results in
  via these methods.
- `webrtc_data_channel.h` / `.cpp` — `WebRTCDataChannel`, abstract
  `PacketPeer` over an established data channel.
- `webrtc_data_channel_extension.h` / `.cpp`,
  `webrtc_peer_connection_extension.h` / `.cpp` — `Extension` variants
  allowing a GDExtension to supply a custom WebRTC backend implementation
  (the native backend below is itself implemented against this same
  extension surface via the `Native` naming convention used elsewhere in the
  engine).

## Platform implementations

- `webrtc_peer_connection_js.h` / `.cpp`, `webrtc_data_channel_js.h` / `.cpp`,
  `library_godot_webrtc.js` — Web/Emscripten backend: thin C++↔JS bridge
  calling into the browser's native `RTCPeerConnection`/`RTCDataChannel`
  JS APIs. Only compiled for `platform=web`.
- Native (non-web) platforms require a third-party WebRTC library plugin
  providing a `WebRTCPeerConnectionExtension`/`WebRTCDataChannelExtension`
  implementation (e.g. libdatachannel-based GDExtensions); no native backend
  ships in this module.

## Multiplayer integration

- `webrtc_multiplayer_peer.h` / `.cpp` — `WebRTCMultiplayerPeer`, adapts a
  mesh of `WebRTCPeerConnection`s (one per remote peer, each application-
  wired via a signaling channel outside this module) into a single
  `MultiplayerPeer` usable by `SceneMultiplayer`.

## Notes

- Signaling (exchanging SDP offers/answers and ICE candidates between
  peers before a direct connection exists) is *not* implemented here — it's
  intentionally left to the game/application layer (e.g. over a WebSocket
  relay using [`modules/websocket/README.md`](../websocket/README.md)).
