import { appendFile } from "fs/promises";
import { join } from "path";
import type { TokenScope } from "../auth.js";
import { Mutex } from "../state/mutex.js";

export type AuditKind = "http_ui" | "mcp_tool";

export interface AuditEntry {
  ts: string;
  token_scope: TokenScope;
  kind: AuditKind;
  name: string;
  ok: boolean;
  duration_ms: number;
  error?: string;
}

const mutex = new Mutex();

export const appendAuditLog = async (entry: AuditEntry): Promise<void> => {
  const line = JSON.stringify(entry) + "\n";
  const path = join(process.cwd(), "state", "AUDIT_LOG.ndjson");
  await mutex.runExclusive(async () => {
    await appendFile(path, line, { encoding: "utf8" });
  });
};
