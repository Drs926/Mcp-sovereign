import type { TaskStatus, VerdictStatus } from "../state/models.js";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isString = (value: unknown): value is string => typeof value === "string";

export const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === "string";

export const isTaskStatus = (value: unknown): value is TaskStatus =>
  value === "todo" || value === "doing" || value === "blocked" || value === "done";

export const isVerdictStatus = (value: unknown): value is VerdictStatus =>
  value === "PASS" || value === "BLOCK";

export interface McpRequest {
  jsonrpc?: string;
  id: string | number | null;
  method: string;
  params?: unknown;
}

export interface McpCallParams {
  name: string;
  input?: unknown;
}

export const isMcpRequest = (body: unknown): body is McpRequest => {
  if (!isRecord(body)) return false;
  if ("jsonrpc" in body && body.jsonrpc !== "2.0") return false;
  if (!("method" in body) || !isString(body.method)) return false;
  if (!("id" in body)) return false;
  return true;
};

export const isCallParams = (value: unknown): value is McpCallParams => {
  if (!isRecord(value)) return false;
  if (!("name" in value) || !isString(value.name)) return false;
  return true;
};

export const isLimitParam = (value: unknown): value is { limit?: number } => {
  if (!isRecord(value)) return false;
  if (value.limit === undefined) return true;
  return typeof value.limit === "number" && Number.isFinite(value.limit);
};

export const isEventAppendInput = (
  value: unknown
): value is { event_name: string; payload: Record<string, unknown> } => {
  if (!isRecord(value)) return false;
  return isString(value.event_name) && isRecord(value.payload);
};

export const isVerdictSetInput = (
  value: unknown
): value is { verdict: VerdictStatus; reason: string; proofs_ref?: string } => {
  if (!isRecord(value)) return false;
  return isVerdictStatus(value.verdict) && isString(value.reason) && isOptionalString(value.proofs_ref);
};

export const isTaskSetActiveInput = (value: unknown): value is { task_id: string } => {
  if (!isRecord(value)) return false;
  return isString(value.task_id);
};

export const isTaskSetStatusInput = (
  value: unknown
): value is { task_id: string; status: TaskStatus } => {
  if (!isRecord(value)) return false;
  return isString(value.task_id) && isTaskStatus(value.status);
};

export const isProofAppendInput = (
  value: unknown
): value is { task_id: string; proof_type: string; payload_ref: string } => {
  if (!isRecord(value)) return false;
  return isString(value.task_id) && isString(value.proof_type) && isString(value.payload_ref);
};

export const isCallDownstreamInput = (
  value: unknown
): value is { downstream: string; tool: string; input?: unknown } => {
  if (!isRecord(value)) return false;
  return isString(value.downstream) && isString(value.tool);
};
