import { JsonRpcRequest } from "../types";

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  if (!isObject(value)) return false;
  if (value.jsonrpc !== "2.0") return false;
  if (!isString(value.method)) return false;
  return true;
}
