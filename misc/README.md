# misc/

`misc/` holds utility scripts, CI helpers, and code-style/tooling configs
that support the build and development process but aren't part of the
engine itself. Most of what's under `misc/scripts/` is wired into
`.pre-commit-config.yaml` (root) and/or CI; a smaller set are one-off/
manual tools you run yourself when needed.

## `misc/scripts/` index

Validators run by pre-commit/CI on every relevant file change:

| Script | Purpose |
|---|---|
| `file_format.py` | Checks line endings (LF), trailing whitespace, final newline, BOM absence. Run locally: `python misc/scripts/file_format.py`. |
| `copyright_headers.py` | Ensures every source file has the correct, up-to-date copyright header block. |
| `header_guards.py` | Checks C++ header include-guard style/naming consistency. |
| `validate_includes.py` | Checks `#include`/`#import` style/ordering conventions. |
| `validate_xml.py` | Validates `doc/classes/*.xml` against `doc/class.xsd` (requires the `xmlschema` package, auto-installed by its pre-commit hook). |
| `validate_codeowners.py` | Checks `.github/CODEOWNERS` glob patterns are well-formed/non-overlapping. |
| `dotnet_format.py` | Runs `dotnet format` over the C#/.NET module sources (`modules/mono`), generating dummy stub files first if needed so formatting doesn't require a full build. |

CI-only helpers (not part of local pre-commit):

| Script | Purpose |
|---|---|
| `check_ci_log.py` | Scans a CI build log for AddressSanitizer errors (invalid read/write) and fails fast so memory bugs aren't missed in noisy logs. |
| `purge_cache.py` | Cleans old SCons/CI cache files to keep CI cache size bounded. |
| `validate_extension_api.sh` | Diffs the current `--dump-extension-api` output against the committed baseline to catch accidental/undocumented GDExtension API breaks. |

Manual/one-off tools (run by hand, not hooked into CI):

| Script | Purpose |
|---|---|
| `char_range_fetch.py` | Regenerates `char_range.cpp` (Unicode character-property ranges) from the Unicode Character Database. Deliberately *not* build-integrated — run manually when Unicode data needs updating. |
| `ucaps_fetch.py` | Regenerates `ucaps.h` (Unicode case-mapping tables) from the UCD. Same manual/non-integrated pattern. |
| `unicode_ranges_fetch.py` | Regenerates `unicode_ranges.inc` (Unicode block ranges) from the UCD. Same pattern. |
| `install_accesskit.py`, `install_angle.py`, `install_perfetto.py`, `install_swappy_android.py`, `install_winrt.py`, `install_d3d12_sdk_windows.py`, `install_vulkan_sdk_macos.sh` | Fetch/install third-party SDKs and native dependencies (AccessKit, ANGLE, Perfetto, Android Swappy, WinRT, D3D12 SDK, Vulkan SDK) needed for certain build configurations. Run once per machine/toolchain setup, typically before building with that feature enabled. |
| `make_icons.sh` | Regenerates app icon assets from source art. |
| `make_tarball.sh` | Packages a release source tarball (used for official releases). |
| `gitignore_check.sh` | Sanity-checks that `.gitignore` patterns match tracked/untracked file expectations. |

## Dependencies

Most scripts are stdlib-only Python; a few need extras noted in their
pre-commit hook (e.g. `validate_xml.py` needs `xmlschema`,
`validate_codeowners.py`/others may need `tomli` on older Python). Shell
scripts (`.sh`) are POSIX-oriented and intended for Linux/macOS/CI use.

## Other subdirectories

- **`dist/`** — Platform packaging assets: app icons, `.desktop`/plist/
  manifest templates, and other files bundled into distributed builds.
- **`error_suppressions/`** — Suppression lists for external analysis tools
  (e.g. sanitizers/static analyzers) to silence known/accepted findings in
  `thirdparty/` or otherwise-unfixable code.
- **`extension_api_validation/`** — Baseline/expected-diff data used by
  `scripts/validate_extension_api.sh` to detect breaking GDExtension API
  changes between commits.
- **`logo/`** — Godot logo/branding source assets.
- **`msvs/`** — Visual Studio project/solution generation helpers for
  building Godot with MSVC tooling.
- **`utility/`** — Shared Python helpers imported by SCons build scripts
  (`scons_hints.py` and similar), not meant to be run standalone.

## Where to look for common tasks

| Task | Start here |
|---|---|
| A pre-commit hook is failing and you want to run it directly | Find the matching entry above, run the script by hand with the same args as `.pre-commit-config.yaml` |
| Need to update Unicode data tables | `char_range_fetch.py`, `ucaps_fetch.py`, `unicode_ranges_fetch.py` |
| Setting up a new build machine for Vulkan/D3D12/ANGLE/etc. | The relevant `install_*` script |
| CI flagged a possible ASan issue | `check_ci_log.py` |
