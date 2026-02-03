# sovereign-mcp

Minimal MCP orchestrator with Fastify, JSON-RPC 2.0, optional SSE streaming, downstream MCP client, and audited token auth.

## Quickstart
1. Copy `.env.example` to `.env` and set tokens.
2. Install and build:
   - `npm install`
   - `npm run build`
3. Start: `npm run start`

## Endpoints
- `GET /health` -> `{ ok: true }`
- `POST /mcp` -> JSON-RPC 2.0

### Streaming SSE
Add `Accept: text/event-stream` or `?stream=1` to receive SSE events. The server sends a `result` event and then `done`.

## Auth
- `Authorization: Bearer <token>` or `x-mcp-token: <token>`
- Read tokens are allowed for read-only calls.
- Write tokens are required when the request is marked `params.write: true`.

## Logs
- `state/AUDIT_LOG.ndjson` for audit trail
- `state/EVENT_LOG.ndjson` for event trail

## Notes
- No direct `zod` dependency or usage.
- Atomic writes use temp files + rename with an in-process mutex.
