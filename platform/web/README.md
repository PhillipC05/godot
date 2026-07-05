# Web platform port

This folder contains the C++ and JavaScript code for the Web platform port,
compiled using [Emscripten](https://emscripten.org/).

It also contains a ESLint linting setup (see [`package.json`](package.json)).

See also [`misc/dist/html`](/misc/dist/html) folder for additional files used by
this platform such as the html shell (web page).

## Documentation

- [Compiling for the Web](https://docs.godotengine.org/en/latest/engine_details/development/compiling/compiling_for_web.html)
  - Instructions on building this platform port from source.
- [Exporting for the Web](https://docs.godotengine.org/en/latest/tutorials/export/exporting_for_web.html)
  - Instructions on using the compiled export templates to export a project.

## Architecture Overview

The Web platform port uses Emscripten to compile Godot's C++ codebase to WebAssembly (WASM), enabling Godot projects to run in browsers. The architecture consists of several components:

### C++ to JavaScript Bridge

The communication between C++ and JavaScript is primarily handled through [`godot_js.h`](godot_js.h), which declares external JavaScript functions using Emscripten's linkage convention:

```cpp
extern "C" {
    extern void godot_js_os_shell_open(const char *p_uri);
    // ... other function declarations
}
```

This header file defines the interface that the C++ code uses to call JavaScript functionality. Each `godot_js_*` function declared in this header is implemented in the corresponding JavaScript library files in [`js/libs/`](js/libs/).

### JavaScript Library Files

The [`js/libs/`](js/libs/) directory contains JavaScript implementations that correspond to the C++ interface functions:

| C++ Header Section | JavaScript Library | Purpose |
|-------------------|-------------------|---------|
| Config | `library_godot_os.js` | Canvas and locale configuration |
| OS | `library_godot_os.js` | File system, shell open, PWA support |
| Input | `library_godot_input.js` | Mouse, keyboard, touch, gamepad handling |
| Display | `library_godot_display.js` | Canvas, fullscreen, clipboard, virtual keyboard |
| Audio | `library_godot_audio.js` | Web Audio API integration |
| WebGL2 | `library_godot_webgl2.js` | WebGL 2.0 rendering support |
| Fetch | `library_godot_fetch.js` | HTTP requests and file download |
| JavaScript Singleton | `library_godot_javascript_singleton.js` | `JavaScriptBridge` global scope access |
| WebMIDI | `library_godot_webmidi.js` | MIDI device support |
| Emscripten | `library_godot_emscripten.js` | Emscripten runtime integration |

The build system (see [`SCsub`](SCsub)) links these JavaScript libraries using Emscripten's `--js-library` flag, integrating them into the final WASM module.

### Engine Files

The [`js/engine/`](js/engine/) directory contains the boot sequence and configuration logic:

- `engine.js` - Main engine class and startup sequence
- `config.js` - Configuration management
- `features.js` - Feature detection for browser compatibility
- `preloader.js` - Resource preloader

## Development

### Linting

To run the ESLint checks on the Web platform JavaScript code:

```bash
npm run lint
```

This command lints the following directories:
- `platform/web/js` - Web platform JavaScript libraries and engine
- `modules` - Module JavaScript code
- `misc/dist/html` - Distribution HTML templates

To automatically fix linting issues:

```bash
npm run format
```

### Documentation Generation

Generate JSDoc documentation (converted to reStructuredText format):

```bash
npm run docs
```

This uses a custom JSDoc template (`js/jsdoc2rst/`) to generate documentation for:
- `js/engine/engine.js`
- `js/engine/config.js`
- `js/engine/features.js`

## Debugging

### Browser Developer Tools

Web exports can be debugged using standard browser developer tools:

1. Open the browser's Developer Tools (F12 or right-click → "Inspect")
2. Use the **Console** tab to view Godot's output:
   - `console.log()` calls from Godot appear in the console
   - JavaScript errors and exceptions are displayed here
3. Use the **Network** tab to inspect:
   - WASM module loading and size
   - Asset loading progress and any failed requests
4. Use the **Debugger/Sources** tab to:
   - Set breakpoints in JavaScript code
   - Debug the engine boot sequence
   - Inspect the generated WASM module

**Note:** When debugging with threads enabled (`GODOT_THREADS_ENABLED`), multiple workers are created. Check the **Workers** section in the debugger to inspect each thread.

### Emscripten ASSERTIONS Flag

For development builds, enable Emscripten's runtime assertions to catch potential issues:

```bash
scons platform=web target=template_debug ASSERTIONS=1
```

Or when using the SCons configuration directly, add `-sASSERTIONS=1` to your Emscripten flags.

The `ASSERTIONS` flag enables:

- Runtime checks for invalid function pointer calls
- Null pointer checks for direct WASM memory access
- Additional sanity checks that help identify memory corruption issues
- More descriptive error messages when things go wrong

**Warning:** ASSERTIONS add overhead and should only be used for development/debugging, not production builds.

### Local Development Server

When testing locally, use the built-in development server which includes proper CORS headers:

```bash
scons platform=web target=template_debug serve
```

Or run the Python server directly:

```bash
python platform/web/serve.py
```

The server automatically adds required headers for Web exports:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These headers are required for features like:
- SharedArrayBuffer (needed for threads)
- WebGPU (cross-origin isolation)
- Proper WASM memory sharing

## Deployment

### Recommended CSP Headers

For optimal security when deploying Web exports, configure the following Content Security Policy (CSP) headers on your web server:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```

**CSP Directive Breakdown:**

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src` | `'self'` | Default fallback for other directives |
| `script-src` | `'self' 'unsafe-inline'` | Scripts must be from same origin; `'unsafe-inline'` needed for inline script in HTML templates |
| `style-src` | `'self' 'unsafe-inline'` | Styles must be from same origin; inline styles in templates |
| `img-src` | `'self' data:` | Images from same origin or embedded data URIs |
| `connect-src` | `'self'` | XHR/WebSocket connections to same origin |
| `worker-src` | `'self' blob:` | Web Workers can be from same origin or blob URLs (used by Emscripten) |
| `frame-ancestors` | `'none'` | Prevents the page from being embedded in iframes |
| `base-uri` | `'self'` | Restricts `<base>` element to same origin |
| `form-action` | `'self'` | Form submissions to same origin |

### Required Headers for SharedArrayBuffer

If your project uses threads or WebRTC, you also need these headers:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
```

These headers enable:
- SharedArrayBuffer for thread synchronization
- high-resolution timers (`performance.now()`)
- WebRTC data channels

**Warning:** These headers have implications for your entire domain. If you have other content on the same domain, ensure they are compatible with cross-origin isolation.

### MIME Types

Ensure your server serves files with correct MIME types:

| File Extension | MIME Type |
|---------------|-----------|
| `.wasm` | `application/wasm` |
| `.js` | `text/javascript; charset=utf-8` |

## Artwork license

[`logo.svg`](export/logo.svg) and [`run_icon.svg`](export/run_icon.svg) are licensed under
[Creative Commons Attribution 3.0 Unported](https://www.w3.org/html/logo/faq.html#how-licenced)
per the HTML5 logo usage guidelines.