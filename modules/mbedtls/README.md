# modules/mbedtls/

Wraps **thirdparty/mbedtls** to implement Godot's `Crypto`, `StreamPeerTLS`,
`PacketPeerDTLS`, and `DTLSServer` abstractions (defined in `core/crypto/`
and `core/io/`). This is the engine's only TLS/DTLS/crypto backend — always
built (`can_build` unconditionally `True`).

## Classes

- `crypto_mbedtls.h` / `.cpp` — `CryptoMbedTLS` (`Crypto`) and
  `CryptoKeyMbedTLS` (`CryptoKey`): key generation, X.509 certificate
  handling, hashing, HMAC.
- `tls_context_mbedtls.h` / `.cpp` — `TLSContextMbedTLS`, shared handshake
  and certificate-verification logic used by both the stream (TCP/TLS) and
  packet (UDP/DTLS) peers below.
- `stream_peer_mbedtls.h` / `.cpp` — `StreamPeerMbedTLS` (`StreamPeerTLS`):
  client/server TLS over a `StreamPeer` (typically `StreamPeerTCP`).
- `packet_peer_mbed_dtls.h` / `.cpp` — `PacketPeerMbedDTLS` (`PacketPeerDTLS`):
  DTLS over a `PacketPeerUDP`.
- `dtls_server_mbedtls.h` / `.cpp` — `DTLSServerMbedTLS` (`DTLSServer`):
  accepts new DTLS connections, using mbedTLS's cookie mechanism
  (`ssl_cookie`) to mitigate UDP amplification/spoofing during the
  handshake.

## Notes

- `network/tls/enable_tls_v1.3` project setting (default `true`, set in
  `register_types.cpp`) toggles TLS 1.3 support.
- `GODOT_MBEDTLS_COMPAT_ARGS` / `godot_mbedtls_random_compat()` in
  `crypto_mbedtls.h` bridge an RNG API signature change between mbedTLS 2.x
  and 3.x/4.x so the rest of the module doesn't need `#ifdef`s at every
  call site.
- **Security note:** this module vendors a cryptographic library
  (`thirdparty/mbedtls`). Version bumps here should track upstream mbedTLS
  security advisories directly rather than waiting for a general
  third-party dependency refresh — a CVE fix in mbedTLS is a security fix
  for every Godot project using networking or `Crypto` until the vendored
  copy is updated.
