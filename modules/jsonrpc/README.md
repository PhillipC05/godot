# modules/jsonrpc/

A minimal [JSON-RPC 2.0](https://www.jsonrpc.org/specification) protocol
implementation, exposed to scripts as `JSONRPC`. It handles message
construction and dispatch only — transport (sockets, stdio, WebSocket, etc.)
is left entirely to the caller.

The primary in-engine consumer is the GDScript Language Server
(`modules/gdscript/language_server/`), which speaks JSON-RPC over
stdio/TCP to editors (VS Code, etc.) implementing the Language Server
Protocol.

## Core class

- `jsonrpc.h` / `.cpp` — `JSONRPC`.
  - `make_request()` / `make_response()` / `make_notification()` /
    `make_response_error()` — build the four JSON-RPC message shapes as
    `Dictionary`, ready to be `JSON.stringify()`'d and sent over whatever
    transport the caller uses.
  - `set_method(name, callback)` — registers a `Callable` to invoke when a
    request or notification for `name` is processed.
  - `process_action()` / `process_request()` — dispatch a single decoded
    JSON-RPC object (or batch, via `p_process_arr_elements`) to its
    registered method, returning a response object (or null for
    notifications, per spec).
  - `process_string()` — convenience wrapper that parses raw JSON text,
    dispatches, and serializes the response back to a string in one call.
  - `set_response_handler(id, callback)` / `process_response()` — the
    client-side half: register a callback keyed by request ID to handle a
    response object once it arrives, for callers that also act as a
    JSON-RPC *client* (not just a server).
  - `ErrorCode` enum mirrors the spec's reserved error codes
    (`PARSE_ERROR`, `INVALID_REQUEST`, `METHOD_NOT_FOUND`,
    `INVALID_PARAMS`, `INTERNAL_ERROR`).

## Tests

- `tests/` — Unit tests covering request/response/notification construction
  and dispatch.

## Notes

- Batch requests (a JSON array of request objects) are supported via the
  `p_process_arr_elements` parameter on `process_action()`.
