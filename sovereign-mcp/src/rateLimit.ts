import type { FastifyRequest } from "fastify";

interface RateState {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const LIMIT = 60;

const buckets = new Map<string, RateState>();

export const checkRateLimit = (request: FastifyRequest, token: string): { ok: boolean; retryAfterMs?: number } => {
  const now = Date.now();
  const existing = buckets.get(token);
  if (!existing || existing.resetAt <= now) {
    buckets.set(token, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (existing.count >= LIMIT) {
    return { ok: false, retryAfterMs: existing.resetAt - now };
  }
  existing.count += 1;
  return { ok: true };
};
