import { setTimeout as delay } from "timers/promises";

export interface McpClientConfig {
  baseUrl: string;
  token: string;
  timeoutMs: number;
  transport: "http" | "sse";
}

export interface McpResponse<T> {
  id: string | number | null;
  result?: T;
  error?: { message: string };
}

const resolveEndpoint = (baseUrl: string): string => {
  if (baseUrl.endsWith("/mcp")) return baseUrl;
  return `${baseUrl.replace(/\/$/, "")}/mcp`;
};

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = delay(timeoutMs).then(() => controller.abort());
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    await timeout.catch(() => undefined);
  }
};

const parseSsePayload = async (response: Response, timeoutMs: number): Promise<unknown> => {
  if (!response.body) {
    throw new Error("Downstream SSE response has no body");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const markerIndex = buffer.indexOf("\n\n");
    if (markerIndex !== -1) {
      const chunk = buffer.slice(0, markerIndex);
      const line = chunk
        .split("\n")
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith("data:"));
      if (!line) {
        throw new Error("Downstream SSE payload missing data line");
      }
      const json = line.replace(/^data:\\s*/, "");
      return JSON.parse(json);
    }
  }
  throw new Error("Downstream SSE timed out");
};

const requestMcp = async <T>(config: McpClientConfig, body: string): Promise<McpResponse<T>> => {
  const endpoint = resolveEndpoint(config.baseUrl);
  const response = await fetchWithTimeout(
    endpoint,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: config.transport === "sse" ? "text/event-stream" : "application/json",
        authorization: `Bearer ${config.token}`
      },
      body
    },
    config.timeoutMs
  );
  if (config.transport === "sse") {
    const payload = (await parseSsePayload(response, config.timeoutMs)) as McpResponse<T>;
    if (payload.error) {
      throw new Error(payload.error.message);
    }
    return payload;
  }
  const payload = (await response.json()) as McpResponse<T>;
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? `Downstream error (${response.status})`);
  }
  return payload;
};

export const listTools = async (config: McpClientConfig): Promise<unknown[]> => {
  const body = JSON.stringify({ jsonrpc: "2.0", id: "list_tools", method: "list_tools" });
  const payload = await requestMcp<{ tools: unknown[] }>(config, body);
  return payload.result?.tools ?? [];
};

export const callTool = async (
  config: McpClientConfig,
  name: string,
  input: unknown
): Promise<unknown> => {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: `call_${name}`,
    method: "call_tool",
    params: { name, input }
  });
  const payload = await requestMcp<{ output: unknown }>(config, body);
  if (payload.result && "output" in payload.result) {
    return (payload.result as { output: unknown }).output;
  }
  const content = (payload.result as unknown as { content?: Array<{ type: string; text?: string }> })
    ?.content;
  if (content && content.length > 0 && content[0].type === "text") {
    const text = content[0].text ?? "";
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return null;
};
