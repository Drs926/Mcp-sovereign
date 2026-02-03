import "fastify";
import type { TokenScope } from "./auth.js";

declare module "fastify" {
  interface FastifyRequest {
    auth: { scope: TokenScope; token: string };
  }
}
