# modules/openxr/

Integrates the Khronos **OpenXR** runtime API as an `XRInterface`, giving
Godot VR/AR/MR support across any OpenXR-conformant runtime (SteamVR, Meta
Quest, Windows Mixed Reality, etc.). By far the largest and most actively
developed XR module — see `config.py`'s `get_doc_classes()` for 70+ bound
classes. Builds on `linuxbsd`, `windows`, `android`, and `macos` when XR is
not disabled (`disable_xr` SCons option).

## Classes

- `openxr_api.h` / `.cpp` — `OpenXRAPI`, the low-level singleton wrapping
  the raw OpenXR C API: instance/session lifecycle, swapchain management,
  frame timing (`xrWaitFrame`/`xrBeginFrame`/`xrEndFrame`), space and
  reference-space handling. Everything else in the module is built on top
  of this.
- `openxr_interface.h` / `.cpp` — `OpenXRInterface`, the `XRInterface`
  Godot's `XRServer` actually drives: render target size, per-view
  transforms/projections, tracking status.
- `openxr_api_extension.h` / `.cpp` — `OpenXRAPIExtension`, exposes
  `OpenXRAPI` internals to GDExtension for advanced/custom XR add-ons.
- `action_map/` — `OpenXRAction`, `OpenXRActionSet`, `OpenXRActionMap`,
  `OpenXRInteractionProfile`, `OpenXRBindingModifier` and friends: the
  input-binding data model (editable in the editor's OpenXR Action Map
  dock) that maps controller buttons/axes/poses to named actions.
- `extensions/` — one file pair per **OpenXR extension** (`XR_FB_*`,
  `XR_HTC_*`, `XR_KHR_*`, `XR_META_*`, `XR_ML_*`, `XR_EXT_*`, …), each
  wrapping a vendor or Khronos extension: hand tracking, eye gaze, foveation,
  composition layers, display refresh rate, render models, spatial
  entities/anchors, D-pad bindings, and more. `OpenXRExtensionWrapper` is
  the base class new extensions subclass; `OpenXRExtensionWrapperExtension`
  exposes the same hook points to GDExtension.

## Notes

- `#define MODULE_OPENXR_HAS_PREREGISTER` in `register_types.h` — OpenXR
  extensions must be registered before the rendering driver initializes
  (they can add required Vulkan/GL instance extensions), so this module
  hooks a pre-register phase most modules don't need.
- Extension classes are added via a registry pattern (`extensions/SCsub`
  builds each independently); enabling/disabling individual OpenXR
  extensions at runtime does not require recompiling the module.
- Related but independent interfaces: [`modules/mobile_vr/README.md`](../mobile_vr/README.md)
  (phone-sensor-based 3DOF VR) and [`modules/webxr/README.md`](../webxr/README.md)
  (browser WebXR) — neither depends on this module.
