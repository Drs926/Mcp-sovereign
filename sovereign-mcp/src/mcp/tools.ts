import type { TokenScope } from "../auth.js";
import type { DownstreamClient } from "../downstream/registry.js";
import { appendEvent, readRecentEvents } from "../state/eventLog.js";
import type { ProjectState } from "../state/models.js";
import { loadProjectState, updateProjectState } from "../state/projectState.js";
import {
  isCallDownstreamInput,
  isEventAppendInput,
  isLimitParam,
  isProofAppendInput,
  isTaskSetActiveInput,
  isTaskSetStatusInput,
  isVerdictSetInput
} from "./validation.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolContext {
  scope: TokenScope;
  downstreams: Record<string, DownstreamClient>;
}

const nowIso = () => new Date().toISOString();

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "sovereign.health",
    description: "Health check for sovereign MCP",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "sovereign.list_downstreams",
    description: "List downstream MCP connections",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "sovereign.call_downstream",
    description: "Call a downstream MCP tool",
    inputSchema: {
      type: "object",
      properties: {
        downstream: { type: "string" },
        tool: { type: "string" },
        input: { type: "object" }
      },
      required: ["downstream", "tool"],
      additionalProperties: false
    }
  },
  {
    name: "project.get_state",
    description: "Get canonical project state",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "project.get_history",
    description: "Get recent event history",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number" } },
      additionalProperties: false
    }
  },
  {
    name: "event.append",
    description: "Append an event to the log",
    inputSchema: {
      type: "object",
      properties: {
        event_name: { type: "string" },
        payload: { type: "object" }
      },
      required: ["event_name", "payload"],
      additionalProperties: false
    }
  },
  {
    name: "verdict.set",
    description: "Set verdict state",
    inputSchema: {
      type: "object",
      properties: {
        verdict: { type: "string", enum: ["PASS", "BLOCK"] },
        reason: { type: "string" },
        proofs_ref: { type: "string" }
      },
      required: ["verdict", "reason"],
      additionalProperties: false
    }
  },
  {
    name: "task.set_active",
    description: "Set active task",
    inputSchema: {
      type: "object",
      properties: { task_id: { type: "string" } },
      required: ["task_id"],
      additionalProperties: false
    }
  },
  {
    name: "task.set_status",
    description: "Set task status",
    inputSchema: {
      type: "object",
      properties: { task_id: { type: "string" }, status: { type: "string" } },
      required: ["task_id", "status"],
      additionalProperties: false
    }
  },
  {
    name: "proof.append",
    description: "Append a proof reference to a task",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        proof_type: { type: "string" },
        payload_ref: { type: "string" }
      },
      required: ["task_id", "proof_type", "payload_ref"],
      additionalProperties: false
    }
  }
];

export const handleToolCall = async (
  name: string,
  input: unknown,
  context: ToolContext
): Promise<unknown> => {
  switch (name) {
    case "sovereign.health":
      return { ok: true, time: nowIso() };
    case "sovereign.list_downstreams":
      return { downstreams: Object.keys(context.downstreams) };
    case "sovereign.call_downstream": {
      if (!isCallDownstreamInput(input)) {
        throw new Error("Invalid input for sovereign.call_downstream");
      }
      const downstream = context.downstreams[input.downstream];
      if (!downstream) {
        throw new Error("Unknown downstream");
      }
      const output = await downstream.callTool(input.tool, input.input ?? {});
      return { downstream: input.downstream, tool: input.tool, output };
    }
    case "project.get_state":
      return await loadProjectState();
    case "project.get_history": {
      if (!isLimitParam(input)) {
        throw new Error("Invalid input for project.get_history");
      }
      const limit = typeof input.limit === "number" ? Math.min(Math.max(input.limit, 1), 500) : 50;
      return { events: await readRecentEvents(limit) };
    }
    case "event.append": {
      if (!isEventAppendInput(input)) {
        throw new Error("Invalid input for event.append");
      }
      const event = { ts: nowIso(), name: input.event_name, payload: input.payload };
      await appendEvent(event);
      await updateProjectState((state) => ({
        ...state,
        current_event: input.event_name,
        last_update_at: event.ts
      }));
      return { ok: true };
    }
    case "verdict.set": {
      if (!isVerdictSetInput(input)) {
        throw new Error("Invalid input for verdict.set");
      }
      const ts = nowIso();
      await updateProjectState((state) => ({
        ...state,
        last_verdict: {
          verdict: input.verdict,
          reason: input.reason,
          proofs_ref: input.proofs_ref,
          at: ts
        },
        blocked_reason: input.verdict === "BLOCK" ? input.reason : null,
        last_update_at: ts
      }));
      return { ok: true };
    }
    case "task.set_active": {
      if (!isTaskSetActiveInput(input)) {
        throw new Error("Invalid input for task.set_active");
      }
      const ts = nowIso();
      await updateProjectState((state) => ({
        ...state,
        active_task_id: input.task_id,
        last_update_at: ts
      }));
      return { ok: true };
    }
    case "task.set_status": {
      if (!isTaskSetStatusInput(input)) {
        throw new Error("Invalid input for task.set_status");
      }
      const ts = nowIso();
      await updateProjectState((state) => {
        const tasks = [...state.tasks];
        const existing = tasks.find((task) => task.id === input.task_id);
        if (existing) {
          existing.status = input.status;
        } else {
          tasks.push({ id: input.task_id, status: input.status, proofs: [] });
        }
        return { ...state, tasks, last_update_at: ts };
      });
      return { ok: true };
    }
    case "proof.append": {
      if (!isProofAppendInput(input)) {
        throw new Error("Invalid input for proof.append");
      }
      const ts = nowIso();
      await updateProjectState((state) => {
        const tasks = [...state.tasks];
        let task = tasks.find((entry) => entry.id === input.task_id);
        if (!task) {
          task = { id: input.task_id, status: "todo", proofs: [] };
          tasks.push(task);
        }
        task.proofs = task.proofs ?? [];
        task.proofs.push({ type: input.proof_type, ref: input.payload_ref, at: ts });
        return { ...state, tasks, last_update_at: ts } as ProjectState;
      });
      return { ok: true };
    }
    default:
      throw new Error("Unknown tool");
  }
};
