# modules/upnp/

UPnP (Universal Plug and Play) port mapping support, exposed to scripts as
`UPNP`/`UPNPDevice`. Lets a peer-to-peer game request that a player's home
router forward an external port to their machine, without requiring manual
router configuration — the main use case is enabling direct
[`modules/enet/README.md`](../enet/README.md) or raw-socket connections to
reach a player behind NAT.

## Core classes

- `upnp.h` / `.cpp` — `UPNP`, the entry point. `discover()` broadcasts an
  SSDP query on the LAN to find gateway devices; discovered devices are
  exposed via `get_device_count()`/`get_device(i)`/`get_gateway()`.
  `add_port_mapping()`/`delete_port_mapping()` request/remove a forwarding
  rule on the gateway. `query_external_address()` returns the router's
  public IP. Errors are reported via the `UPNPResult` enum, which mirrors
  UPnP's own IGD (Internet Gateway Device) protocol error codes.
- `upnp_device.h` / `.cpp` — `UPNPDevice`, one discovered gateway/IGD device;
  holds the per-device igd control URL and service type used to issue
  SOAP actions against it.

## Implementation

- `upnp_miniupnp.cpp` / `.h`, `upnp_device_miniupnp.cpp` / `.h` — The
  concrete implementation, built on the third-party miniupnpc library
  (`thirdparty/miniupnpc/`). This is currently the only backend; `UPNP` and
  `UPNPDevice` are abstract specifically to allow that to change without
  touching the scripting API.

## Notes

- UPnP is a best-effort mechanism: many routers have it disabled, and it
  only helps with NAT traversal on the local gateway (it does nothing for
  carrier-grade NAT/CGNAT, which is increasingly common on mobile/ISP
  connections). Games should treat failures from `discover()` /
  `add_port_mapping()` as expected and fall back to a relay/rendezvous
  server strategy.
