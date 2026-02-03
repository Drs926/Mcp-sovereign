# sovereign-mcp

Local MCP gateway providing an inbound MCP server, a read-only UI API, and MCP client access to downstream servers.

## Installation

```bash
cd sovereign-mcp
npm install
```

## Configuration

Copy the sample env file and edit values:

```bash
cp .env.example .env
```

Required variables:

- `SOVEREIGN_PORT`
- `SOVEREIGN_TOKEN_READ`
- `SOVEREIGN_TOKEN_WRITE`
- `DOWNSTREAM_STITCH_BASE_URL`
- `DOWNSTREAM_STITCH_TOKEN`
- `DOWNSTREAM_STITCH_TRANSPORT` (`http` or `sse`)
- `DOWNSTREAM_MEMORY_BASE_URL`
- `DOWNSTREAM_MEMORY_TOKEN`
- `DOWNSTREAM_MEMORY_TRANSPORT` (`http` or `sse`)
- `ALLOWLIST_MODE`

## Run local

```bash
npm run dev
```

For production build:

```bash
npm run build
npm start
```

## UI API (read-only)

Example call to fetch the canonical state:

```bash
curl -H "Authorization: Bearer $SOVEREIGN_TOKEN_READ" \
  http://localhost:8787/ui/state
```

## MCP inbound example

```bash
curl -H "Authorization: Bearer $SOVEREIGN_TOKEN_READ" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"demo","method":"list_tools"}' \
  http://localhost:8787/mcp
```

Calling a tool:

```bash
curl -H "Authorization: Bearer $SOVEREIGN_TOKEN_WRITE" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"demo","method":"call_tool","params":{"name":"project.get_state"}}' \
  http://localhost:8787/mcp
```

## Downstream MCP clients

Downstream connections are handled via MCP HTTP requests. If your downstream uses SSE, set the transport env var to `sse` and ensure the base URL points at the MCP endpoint. The MCP client implementation in `src/downstream/mcpClient.ts` can be adapted if your downstream expects a different endpoint path.
