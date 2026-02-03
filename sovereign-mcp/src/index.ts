import Fastify from "fastify";
import { authenticateRequest } from "./auth.js";
import { loadConfig } from "./config.js";
import { appendAuditLog } from "./audit/auditLog.js";
import { checkRateLimit } from "./rateLimit.js";
import { buildDownstreamRegistry } from "./downstream/registry.js";
import { registerMcpRoutes } from "./mcp/server.js";
import { registerUiRoutes } from "./ui/routes.js";

const config = loadConfig();
const fastify = Fastify({ logger: true });

fastify.decorateRequest("auth", null);

fastify.addHook("preHandler", async (request, reply) => {
  const start = Date.now();
  const auth = authenticateRequest(request, config);
  if (!auth.ok || !auth.scope || !auth.token) {
    await appendAuditLog({
      ts: new Date().toISOString(),
      token_scope: "read",
      kind: "http_ui",
      name: "auth",
      ok: false,
      duration_ms: Date.now() - start,
      error: auth.error ?? "Unauthorized"
    });
    reply.code(401).send({ error: auth.error ?? "Unauthorized" });
    return reply;
  }
  const rate = checkRateLimit(request, auth.token);
  if (!rate.ok) {
    await appendAuditLog({
      ts: new Date().toISOString(),
      token_scope: auth.scope,
      kind: "http_ui",
      name: "rate_limit",
      ok: false,
      duration_ms: Date.now() - start,
      error: "Rate limit exceeded"
    });
    reply.code(429).send({ error: "Rate limit exceeded" });
    return reply;
  }
  request.auth = { scope: auth.scope, token: auth.token };
});

const downstreams = buildDownstreamRegistry(config);

registerMcpRoutes(fastify, downstreams);
registerUiRoutes(fastify);

const start = async () => {
  await fastify.listen({ port: config.port, host: "0.0.0.0" });
  fastify.log.info(`sovereign-mcp listening on ${config.port}`);
};

start().catch((err) => {
  fastify.log.error(err, "Failed to start server");
  process.exit(1);
});
