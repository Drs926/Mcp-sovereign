export type AllowlistMode = "default";

export interface DownstreamConfig {
  name: string;
  baseUrl: string;
  token: string;
  transport: "http" | "sse";
}

export interface AppConfig {
  port: number;
  tokenRead: string;
  tokenWrite: string;
  allowlistMode: AllowlistMode;
  downstreams: Record<string, DownstreamConfig>;
}

const required = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

export const loadConfig = (): AppConfig => {
  const port = Number(process.env.SOVEREIGN_PORT ?? "8787");
  const tokenRead = required(process.env.SOVEREIGN_TOKEN_READ, "SOVEREIGN_TOKEN_READ");
  const tokenWrite = required(process.env.SOVEREIGN_TOKEN_WRITE, "SOVEREIGN_TOKEN_WRITE");
  const allowlistMode = (process.env.ALLOWLIST_MODE ?? "default") as AllowlistMode;

  const stitchBaseUrl = required(process.env.DOWNSTREAM_STITCH_BASE_URL, "DOWNSTREAM_STITCH_BASE_URL");
  const stitchToken = required(process.env.DOWNSTREAM_STITCH_TOKEN, "DOWNSTREAM_STITCH_TOKEN");
  const stitchTransport = (process.env.DOWNSTREAM_STITCH_TRANSPORT ?? "http") as "http" | "sse";
  const memoryBaseUrl = required(process.env.DOWNSTREAM_MEMORY_BASE_URL, "DOWNSTREAM_MEMORY_BASE_URL");
  const memoryToken = required(process.env.DOWNSTREAM_MEMORY_TOKEN, "DOWNSTREAM_MEMORY_TOKEN");
  const memoryTransport = (process.env.DOWNSTREAM_MEMORY_TRANSPORT ?? "http") as "http" | "sse";

  return {
    port,
    tokenRead,
    tokenWrite,
    allowlistMode,
    downstreams: {
      stitch: {
        name: "stitch",
        baseUrl: stitchBaseUrl,
        token: stitchToken,
        transport: stitchTransport
      },
      memory_accelerator: {
        name: "memory_accelerator",
        baseUrl: memoryBaseUrl,
        token: memoryToken,
        transport: memoryTransport
      }
    }
  };
};
