import "dotenv/config";
import { Config } from "./types";
import { envBool, envCsv, envNumber, envString } from "./utils/env";

export function loadConfig(): Config {
  return {
    port: envNumber("PORT", 3333),
    host: envString("HOST", "0.0.0.0"),
    readTokens: envCsv("READ_TOKENS"),
    writeTokens: envCsv("WRITE_TOKENS"),
    allowlist: envCsv("ALLOWLIST"),
    rateLimitMax: envNumber("RATE_LIMIT_MAX", 60),
    rateLimitWindowMs: envNumber("RATE_LIMIT_WINDOW_MS", 60_000),
    downstreamUrl: process.env.DOWNSTREAM_URL || undefined,
    downstreamSse: envBool("DOWNSTREAM_SSE", false),
    statePath: envString("STATE_PATH", "state/PROJECT_STATE.json"),
    auditLogPath: envString("AUDIT_LOG_PATH", "state/AUDIT_LOG.ndjson"),
    eventLogPath: envString("EVENT_LOG_PATH", "state/EVENT_LOG.ndjson")
  };
}
