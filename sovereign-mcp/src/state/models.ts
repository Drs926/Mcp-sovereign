export type VerdictStatus = "PASS" | "BLOCK";
export type TaskStatus = "todo" | "doing" | "blocked" | "done";

export interface ProjectState {
  project: string;
  mode_active?: string;
  current_event?: string;
  last_verdict?: {
    verdict: VerdictStatus;
    reason: string;
    proofs_ref?: string;
    at: string;
  };
  active_task_id?: string | null;
  tasks: Array<{
    id: string;
    status: TaskStatus;
    title?: string;
    proofs?: Array<{ type: string; ref: string; at: string }>;
  }>;
  next_required_action?: string | null;
  blocked_reason?: string | null;
  last_update_at: string;
}

export interface EventEntry {
  ts: string;
  name: string;
  payload: Record<string, unknown>;
}
