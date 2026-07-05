# modules/webxr/

`XRInterface` for the browser **WebXR Device API**, letting Web export
builds run in VR/AR headsets directly from a browser tab. Requires the
GLES3/compatibility renderer (`env["opengl3"]`) and is incompatible with
`proxy_to_pthread` (disabled automatically for that config in `config.py`)
since WebXR's JS callbacks need to run on the main browser thread.

## Classes

- `webxr_interface.h` / `.cpp` — `WebXRInterface`, an `XRInterface`. Tracks
  input sources via `XRControllerTracker`, exposes WebXR session state
  (`immersive-vr`/`immersive-ar`, reference space type) to GDScript.
- `webxr_interface_js.h` / `.cpp` — the Emscripten/JS bridge half: calls
  into `godot_webxr.h`'s C API, which is implemented on the JS side by
  `platform/web`'s JS libraries, translating browser `XRSession`/`XRFrame`
  callbacks into engine input/tracking updates.
- `godot_webxr.h` — the C ABI shared between this module's C++ and the
  paired JS implementation (analogous to how `platform/web`'s
  `library_godot_*.js` files pair with their C++ callers).

## Notes

- Only builds for `platform=web`; on every other platform this interface
  doesn't exist. See [`modules/openxr/README.md`](../openxr/README.md) for
  native-platform VR/AR and [`modules/mobile_vr/README.md`](../mobile_vr/README.md)
  for sensor-only phone VR.
- Session/permission negotiation (requesting `immersive-vr` vs `immersive-ar`,
  handling the user gesture requirement to enter XR) happens on the JS side;
  the C++ interface only sees state after the browser has granted a session.
