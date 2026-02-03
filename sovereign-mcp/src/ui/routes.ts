import type { FastifyInstance, FastifyRequest } from "fastify";
import { appendAuditLog } from "../audit/auditLog.js";
import type { TokenScope } from "../auth.js";
import { readRecentEvents } from "../state/eventLog.js";
import { loadProjectState } from "../state/projectState.js";

interface AuthedRequest extends FastifyRequest {
  auth: { scope: TokenScope; token: string };
}

export const registerUiRoutes = (fastify: FastifyInstance) => {
  fastify.get("/ui/state", async (request, reply) => {
    const start = Date.now();
    const authRequest = request as AuthedRequest;
    let ok = false;
    let error: string | undefined;
    try {
      const state = await loadProjectState();
      ok = true;
      reply.send(state);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      error = message;
      reply.code(500).send({ error: message });
    } finally {
      await appendAuditLog({
        ts: new Date().toISOString(),
        token_scope: authRequest.auth.scope,
        kind: "http_ui",
        name: "GET /ui/state",
        ok,
        duration_ms: Date.now() - start,
        error
      });
    }
  });

  fastify.get("/ui/history", async (request, reply) => {
    const start = Date.now();
    const authRequest = request as AuthedRequest;
    let ok = false;
    let error: string | undefined;
    try {
      const limitRaw = (request.query as { limit?: string }).limit;
      const limitParsed = limitRaw ? Number(limitRaw) : 50;
      const limit = Number.isFinite(limitParsed)
        ? Math.min(Math.max(limitParsed, 1), 500)
        : 50;
      const events = await readRecentEvents(limit);
      ok = true;
      reply.send({ events });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      error = message;
      reply.code(500).send({ error: message });
    } finally {
      await appendAuditLog({
        ts: new Date().toISOString(),
        token_scope: authRequest.auth.scope,
        kind: "http_ui",
        name: "GET /ui/history",
        ok,
        duration_ms: Date.now() - start,
        error
      });
    }
  });
};
