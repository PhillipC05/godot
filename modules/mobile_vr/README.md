# modules/mobile_vr/

Minimal, dependency-free `XRInterface` for cardboard-style phone VR: uses
the phone's gyroscope/accelerometer for 3DOF head tracking and renders a
stereo split-screen view with configurable lens-distortion parameters. No
SDK dependency (unlike OpenXR or vendor-specific interfaces) — it's a
self-contained reference implementation. Builds wherever XR isn't disabled
(`not env["disable_xr"]`).

## Classes

- `mobile_vr_interface.h` / `.cpp` — `MobileVRInterface`, an `XRInterface`.
  `set_position_from_sensors()` fuses accelerometer + magnetometer readings
  (`combine_acc_mag()`, `scale_magneto()`) into a head `Transform3D`; a
  low-pass filter (`low_pass()`, `scrub()`) smooths the noisy raw sensor
  data. Stereo rendering parameters — `intraocular_dist`, `display_width`,
  `display_to_lens`, lens distortion coefficients `k1`/`k2` — are exposed as
  properties so a project can match a specific cardboard-style headset.
  Includes `XRVRS` (variable rate shading) support to reduce GPU cost in
  the periphery of each eye's view.

## Notes

- Only 3DOF (rotation only, no positional tracking) — the header's own
  comment describes it as "mostly added as an example or base plate for
  more advanced interfaces" rather than a production-grade VR SDK
  integration.
- No lookup table for specific headset models yet; users must tune the
  lens/IOD parameters manually or read them from a cardboard QR code
  (unimplemented `@TODO` in the source).
- Compare with [`modules/openxr/README.md`](../openxr/README.md), which
  supports full 6DOF tracking and hardware-vendor-specific features but
  requires an OpenXR runtime to be present.
