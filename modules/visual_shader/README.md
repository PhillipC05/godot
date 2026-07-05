# modules/visual_shader/

The node-graph shader editor's runtime representation: `VisualShader` and
its ~100 `VisualShaderNode` subclasses compile down to the same GLSL text
consumed by `Shader`/`ShaderMaterial`, so a visual shader graph is just
another way to author a regular Godot shader. Always built (`can_build`
unconditionally `True`).

## Classes

- `visual_shader.h` / `.cpp` — `VisualShader`, a `Shader` subclass storing
  a graph of connected `VisualShaderNode`s per shader `Type` (`TYPE_VERTEX`,
  `TYPE_FRAGMENT`, `TYPE_LIGHT`, `TYPE_SKY`, `TYPE_FOG`, particle process
  types, etc.). Generates GLSL source by walking the graph and emitting
  each node's code contribution in dependency order.
- `VisualShaderNode` and subclasses (see `config.py`'s `get_doc_classes()`
  for the full ~100-class list) — one class per graph node type: math ops
  (`VisualShaderNodeFloatOp`, `VisualShaderNodeVectorOp`, …), constants and
  parameters (`VisualShaderNodeColorConstant`, `VisualShaderNodeTextureParameter`,
  …), texture sampling, transform composition/decomposition, particle
  emitters, SDF/screen-space helpers, and `VisualShaderNodeExpression` /
  `VisualShaderNodeCustom` for embedding raw GLSL or GDExtension-defined
  nodes into the graph.

## Notes

- This module owns the data model and GLSL codegen only; the graph-editing
  UI (node palette, wire-drawing canvas) lives in `editor/plugins/` and is
  compiled only into editor builds.
- No dependencies on other modules; the generated GLSL is compiled the
  same way as any hand-written shader (see
  [`modules/glslang/README.md`](../glslang/README.md) for the GLSL→SPIR-V
  step on the RenderingDevice backends).
