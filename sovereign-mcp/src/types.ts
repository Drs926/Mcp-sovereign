export type JsonRpcId = string | number | null;

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: unknown;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: JsonRpcError;
}

export interface Config {
  port: number;
  host: string;
  readTokens: Set<string>;
  writeTokens: Set<string>;
  allowlist: Set<string>;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  downstreamUrl?: string;
  downstreamSse: boolean;
  statePath: string;
  auditLogPath: string;
  eventLogPath: string;
}

export interface AuditEntry {
  time: string;
  token: string;
  ip: string;
  method: string;
  write: boolean;
  ok: boolean;
  error?: string;
}

export interface EventEntry {
  time: string;
  type: string;
  detail: unknown;
}

export interface ProjectState {
  version: string;
  updatedAt: string;
  data: Record<string, unknown>;
}

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}
