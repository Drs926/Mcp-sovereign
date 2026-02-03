import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { TokenScope } from "../auth.js";
import type { DownstreamClient } from "../downstream/registry.js";
import { appendAuditLog } from "../audit/auditLog.js";
import { downstreamAllowlist, downstreamReadAllowlist, inboundTools, writeOnlyTools } from "./policy.js";
import { handleToolCall, toolDefinitions } from "./tools.js";
import { isCallParams, isMcpRequest } from "./validation.js";

interface McpReply {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { message: string };
}

interface AuthedRequest extends FastifyRequest {
  auth: { scope: TokenScope; token: string };
}

const sendResponse = (reply: FastifyReply, payload: McpReply) => {
  const accept = reply.request.headers.accept ?? "";
  if (typeof accept === "string" && accept.includes("text/event-stream")) {
    reply.raw.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive"
    });
    reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    reply.raw.end();
    return;
  }
  reply.send(payload);
};

const sendError = (reply: FastifyReply, id: string | number | null, message: string) => {
  const payload: McpReply = { jsonrpc: "2.0", id, error: { message } };
  reply.code(400);
  sendResponse(reply, payload);
};

export const registerMcpRoutes = (
  fastify: FastifyInstance,
  downstreams: Record<string, DownstreamClient>
) => {
  fastify.post("/mcp", async (request, reply) => {
    const start = Date.now();
    const authRequest = request as AuthedRequest;
    const { scope } = authRequest.auth;
    let ok = false;
    let name = "mcp.request";
    let error: string | undefined;

    try {
      const body = request.body;
      if (!isMcpRequest(body)) {
        sendError(reply, null, "Invalid MCP request");
        return;
      }
      if (body.method === "list_tools") {
        const response: McpReply = { jsonrpc: "2.0", id: body.id, result: { tools: toolDefinitions } };
        ok = true;
        name = "list_tools";
        sendResponse(reply, response);
        return;
      }
      if (body.method !== "call_tool") {
        sendError(reply, body.id, "Unsupported MCP method");
        return;
      }
      if (!isCallParams(body.params)) {
        sendError(reply, body.id, "Invalid call_tool params");
        return;
      }
      name = body.params.name;
      if (!inboundTools.has(body.params.name)) {
        sendError(reply, body.id, "Tool not allowlisted");
        return;
      }
      if (scope === "read" && writeOnlyTools.has(body.params.name)) {
        sendError(reply, body.id, "Tool requires write scope");
        return;
      }
      if (body.params.name === "sovereign.call_downstream") {
        const input = body.params.input;
        if (typeof input !== "object" || input === null) {
          sendError(reply, body.id, "Invalid downstream input");
          return;
        }
        const downstreamName = (input as { downstream?: string }).downstream;
        const toolName = (input as { tool?: string }).tool;
        if (!downstreamName || !toolName) {
          sendError(reply, body.id, "Missing downstream tool name");
          return;
        }
        const allowlist = downstreamAllowlist[downstreamName];
        if (!allowlist || !allowlist.has(toolName)) {
          sendError(reply, body.id, "Downstream tool not allowlisted");
          return;
        }
        if (scope === "read") {
          const readAllowlist = downstreamReadAllowlist[downstreamName];
          if (!readAllowlist || !readAllowlist.has(toolName)) {
            sendError(reply, body.id, "Downstream tool requires write scope");
            return;
          }
        }
      }
      const output = await handleToolCall(body.params.name, body.params.input, {
        scope,
        downstreams
      });
      const response: McpReply = {
        jsonrpc: "2.0",
        id: body.id,
        result: {
          output,
          content: [{ type: "text", text: JSON.stringify(output) }]
        }
      };
      ok = true;
      sendResponse(reply, response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      error = message;
      sendError(reply, null, message);
    } finally {
      const duration = Date.now() - start;
      await appendAuditLog({
        ts: new Date().toISOString(),
        token_scope: scope,
        kind: "mcp_tool",
        name,
        ok,
        duration_ms: duration,
        error
      });
    }
  });
};
