import type { AgentToolActivity } from "../core/index.js";

/** Omitted fields are patches: they must not erase earlier tool metadata. */
export type AgentToolUpdate = Partial<Omit<AgentToolActivity, "status">> & {
  id: string;
  status?: string;
  description?: string;
};

export type AgentPlanEntry = { content: string; status?: string; priority?: string };
export type AgentClientEvent =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "tool"; tool: AgentToolUpdate }
  | { type: "plan"; entries: AgentPlanEntry[] }
  | { type: "usage"; estimatedCostUsd?: number }
  | { type: "done"; finishReason?: string }
  | { type: "error"; message: string }
  | { type: "heartbeat" };

export type ParseStreamOptions = {
  preserveToolTitles?: boolean;
  /** Keep product-specific trust decisions such as rejected. */
  preserveToolStatuses?: boolean;
  strict?: boolean;
};
export type JsonRecord = Record<string, unknown>;
export const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
