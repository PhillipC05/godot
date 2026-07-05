# modules/glslang/

Wraps Khronos **glslang** to compile GLSL shader source to SPIR-V at
runtime. This is how Godot's Vulkan/D3D12 (via SPIR-V→DXIL) renderers turn
`.glsl` shader text into the bytecode the GPU driver actually consumes.
Always built (`can_build` unconditionally `True`); no Godot classes
registered, just a free function.

## Classes

- `shader_compile.h` / `.cpp` (`register_types.cpp`) —
  `compile_glslang_shader()`: takes GLSL source plus a
  `RenderingDeviceCommons::ShaderStage`, configures a `glslang::TShader` for
  the Vulkan client/target environment, parses and links it, then converts
  the result to SPIR-V via `glslang::GlslangToSpv()`. Honors
  `Engine::is_generate_spirv_debug_info_enabled()` to optionally emit
  SPIR-V debug info (disabled automatically when targeting D3D12, since
  SPIR-V→DXIL conversion doesn't support it).
- `initialize_glslang_module()` / `uninitialize_glslang_module()` call
  `glslang::InitializeProcess()` / `FinalizeProcess()` — required once per
  process before/after any compilation.

## Notes

- Called from the `RenderingDevice` shader-compilation path whenever a
  `.glsl` shader needs to become a `RDShaderSPIRV`; this is the only route
  from GLSL text to SPIR-V bytecode in the engine (no offline/precompiled
  path bypasses it).
- No dependencies on other modules; glslang is vendored under
  `thirdparty/glslang`.
