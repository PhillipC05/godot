# modules/regex/

Wraps **thirdparty/pcre2** to expose Perl-Compatible Regular Expressions to
GDScript/C#. Always built (`can_build` unconditionally `True`); no
build-time options.

## Classes

- `regex.h` / `.cpp` — `RegEx`, a `RefCounted` wrapping a compiled PCRE2
  `code` pointer. `create_from_string()` / `compile()` compile a pattern
  once; `search()` / `search_all()` / `sub()` run it against subject
  strings. `RegExMatch`, a `RefCounted` returned by search methods, exposes
  captured groups by index or name (`get_string()`, `get_start()`,
  `get_end()`, `get_names()`).

## Notes

- `general_ctx` / `code` are opaque `void*` PCRE2 handles, not typed PCRE2
  structs, to avoid leaking PCRE2 headers into `regex.h`'s public interface.
- No dependencies on other modules; PCRE2 is statically linked from
  `thirdparty/pcre2`.
