import type { FastifyRequest } from "fastify";
import type { AppConfig } from "./config.js";

export type TokenScope = "read" | "write";

export interface AuthResult {
  ok: boolean;
  scope?: TokenScope;
  token?: string;
  error?: string;
}

export const authenticateRequest = (request: FastifyRequest, config: AppConfig): AuthResult => {
  const header = request.headers.authorization;
  if (!header || typeof header !== "string") {
    return { ok: false, error: "Missing Authorization header" };
  }
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return { ok: false, error: "Invalid Authorization header" };
  }
  if (token === config.tokenWrite) {
    return { ok: true, scope: "write", token };
  }
  if (token === config.tokenRead) {
    return { ok: true, scope: "read", token };
  }
  return { ok: false, error: "Invalid token" };
};
