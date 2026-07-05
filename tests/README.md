# tests/

`tests/` holds Godot's C++ unit tests, mirroring the source tree they
cover (`tests/core/` tests `core/`, `tests/scene/` tests `scene/`, etc.).
Tests are compiled directly into the engine binary — there's no separate
test executable — and run via a command-line flag. This is the first
place to look when you want confidence a change didn't break existing
behavior, and the easiest place to add coverage for new code.

## Framework

Godot uses [doctest](https://github.com/doctest/doctest) (vendored in
`thirdparty/doctest/`). `test_macros.h` wraps doctest's macros with a few
Godot-specific additions:

- `TEST_CASE("[Group] description")` / `SUBCASE(...)` — standard doctest
  test declaration; the `[Group]` tag (usually the class under test, e.g.
  `[AABB]`, `[Vector3]`) is how `--test-case` filtering targets a suite.
- `TEST_CASE_PENDING(name)` — declares a test but marks it skipped
  (`doctest::skip()`), for known-broken/unimplemented cases you don't want
  counted as a failure yet.
- `TEST_CASE_MAY_FAIL(name)` — runs the test but doesn't fail the suite if
  it fails (`doctest::may_fail()`).
- `TEST_FORCE_LINK(name)` — every test `.cpp` file must include this macro
  near the top (see below); it's part of how test translation units get
  linked into the binary even though nothing else references their symbols.
- `CHECK`/`CHECK_MESSAGE`/`REQUIRE` — assertion macros (doctest's, used
  throughout); `CHECK_MESSAGE` attaches a human-readable failure message.

A minimal test file looks like:

```cpp
#include "tests/test_macros.h"

TEST_FORCE_LINK(test_aabb)

#include "core/math/aabb.h"

namespace TestAABB {
TEST_CASE("[AABB] Constructor methods") {
	CHECK_MESSAGE(
			AABB(Vector3(-1.5, 2, -2.5), Vector3(4, 5, 6)) == AABB(...),
			"AABBs created with the same dimensions but by different methods should be equal.");
}
} // namespace TestAABB
```

`test_utils.h`/`.cpp` provide shared helpers (e.g. temp directory setup);
`signal_watcher.h` lets tests assert a signal was/wasn't emitted;
`display_server_mock.h` provides a headless `DisplayServer` stand-in for
tests that touch windowing without a real display.

## Adding a new test file

Use the generator script rather than hand-rolling boilerplate:

```bash
python tests/create_test.py MyClass path/to/dir
# e.g.:
python tests/create_test.py MeshInstance3D scene/3d
```

This creates `tests/<path>/test_my_class.h` from a template with the
correct namespace, copyright header, and `TEST_FORCE_LINK` already wired
up. Match the path to where the class being tested lives in the main
source tree (mirroring `core/`, `scene/`, `servers/`, etc.).

## SCsub registration

You generally don't need to touch `tests/SCsub` — it globs every `.cpp`
under `tests/**` automatically (`glob.glob("*/**/*.cpp", recursive=True)`)
and force-links them via a generated `force_link.gen.h`
(`test_builders.py`'s `force_link_builder`), which is what makes
`TEST_FORCE_LINK` necessary: without an explicit reference, a translation
unit containing only `TEST_CASE`s (no other symbols) would otherwise be
dropped by the linker. Just add your new file under the matching
subdirectory and rebuild.

## Building and running

```bash
# Build with tests enabled
scons tests=yes

# Run the full suite
./bin/godot.<platform>.editor.x86_64 --test

# Run one file's tests
./bin/godot.<platform>.editor.x86_64 --test --source-file "tests/core/math/test_vector3.h"

# Run by name/tag filter (doctest filter syntax)
./bin/godot.<platform>.editor.x86_64 --test --test-case "*Vector3*"
```

## Other subdirectories

- **`core/`, `scene/`, `servers/`, `platform/`, `compatibility_test/`** —
  C++ unit tests mirroring the corresponding source tree.
- **`data/`** — Fixture files (images, scenes, fonts, etc.) loaded by
  tests.
- **`python_build/`** — Python-level build-system tests (see below), not
  compiled into the engine.

## Python build tests

Separate from the C++ suite: these test the SCons build helper scripts
themselves (source-file discovery, builders), not engine behavior.

```bash
python tests/test_builders.py
```

## Where to look for common tasks

| Task | Start here |
|---|---|
| Add a test for a new/changed class | `python tests/create_test.py <ClassName> <path>`, then fill in `TEST_CASE`s |
| Assert a signal fires | `tests/signal_watcher.h` |
| Test something touching windowing/input headlessly | `tests/display_server_mock.h` |
| Understand doctest macro behavior | `tests/test_macros.h` |
