import type { AppConfig } from "../config.js";
import { callTool, listTools, type McpClientConfig } from "./mcpClient.js";

export interface DownstreamClient {
  name: string;
  listTools: () => Promise<unknown[]>;
  callTool: (tool: string, input: unknown) => Promise<unknown>;
}

const toClientConfig = (config: AppConfig, name: string): McpClientConfig => {
  const downstream = config.downstreams[name];
  return {
    baseUrl: downstream.baseUrl,
    token: downstream.token,
    timeoutMs: 30_000,
    transport: downstream.transport
  };
};

export const buildDownstreamRegistry = (config: AppConfig): Record<string, DownstreamClient> => {
  return {
    stitch: {
      name: "stitch",
      listTools: () => listTools(toClientConfig(config, "stitch")),
      callTool: (tool, input) => callTool(toClientConfig(config, "stitch"), tool, input)
    },
    memory_accelerator: {
      name: "memory_accelerator",
      listTools: () => listTools(toClientConfig(config, "memory_accelerator")),
      callTool: (tool, input) => callTool(toClientConfig(config, "memory_accelerator"), tool, input)
    }
  };
};
