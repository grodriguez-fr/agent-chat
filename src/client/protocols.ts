import { normalizeToolStatus } from "../core/index.js";
import { isRecord, type AgentClientEvent, type JsonRecord } from "./events.js";
import { parseToolUpdate } from "./tool-updates.js";
export type { AgentClientEvent, AgentToolUpdate, AgentPlanEntry } from "./events.js";
export { parseAiSdkDataStream, AgentDataStreamParser, DataStreamLineBuffer, readAgentDataStream } from "./data-stream.js";
export { mergeAgentToolUpdate, isMeaningfulToolTitle } from "./tool-updates.js";
export { agentEventToAcpUpdate } from "./acp-updates.js";

function extractText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(extractText).join("");
  if (!isRecord(value)) return "";
  if (typeof value.text === "string") return value.text;
  return extractText(value.content);
}

export function parseAcpJsonRpc(raw: string): AgentClientEvent[] {
  let message: JsonRecord;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return [];
    message = parsed;
  } catch { return []; }
  if (isRecord(message.error)) return [{ type: "error", message: String(message.error.message ?? "Erreur agent") }];
  if (message.method === "ping") return [{ type: "heartbeat" }];
  if (isRecord(message.result) && typeof message.result.stopReason === "string") return [{ type: "done", finishReason: message.result.stopReason }];
  if (message.method === "_x.ai/session/prompt_complete" || message.method === "x.ai/session/prompt_complete") return [{ type: "done" }];
  if (message.method !== "session/update" || !isRecord(message.params) || !isRecord(message.params.update)) return [];
  const update = message.params.update;
  const kind = String(update.sessionUpdate ?? "");
  if (["agent_message_chunk", "agent_message", "message", "thought", "agent_thought_chunk"].includes(kind)) {
    const text = extractText(update.content);
    return text ? [{ type: kind === "thought" || kind === "agent_thought_chunk" ? "reasoning" : "text", text }] : [];
  }
  if (kind === "turn_completed") return [{ type: "done", ...(typeof update.stopReason === "string" ? { finishReason: update.stopReason } : {}) }];
  if (kind === "plan" && Array.isArray(update.entries)) return [{ type: "plan", entries: update.entries.filter(isRecord).flatMap((entry) => typeof entry.content === "string" ? [{ content: entry.content, ...(typeof entry.status === "string" ? { status: entry.status } : {}), ...(typeof entry.priority === "string" ? { priority: entry.priority } : {}) }] : []) }];
  if (kind === "usage") return [{ type: "usage", ...(typeof update.estimatedCostUsd === "number" && Number.isFinite(update.estimatedCostUsd) && update.estimatedCostUsd >= 0 ? { estimatedCostUsd: update.estimatedCostUsd } : {}) }];
  if (kind !== "tool_call" && kind !== "tool_call_update") return [];
  const meta = isRecord(update._meta) && isRecord(update._meta["x.ai/tool"]) ? update._meta["x.ai/tool"] : undefined;
  const rawOutput = isRecord(update.rawOutput) ? update.rawOutput : undefined;
  const rawInput = isRecord(update.rawInput) ? update.rawInput : undefined;
  const tool = parseToolUpdate({
    ...update,
    id: String(update.toolCallId ?? update.id ?? "tool"),
    title: meta?.name ?? update.title,
    command: update.command ?? rawInput?.command ?? rawOutput?.command,
    description: update.description ?? rawInput?.description,
    path: update.path ?? rawInput?.path,
    ...(kind === "tool_call" && update.status == null ? { status: "pending" } : {}),
    detail: update.detail ?? update.description,
    output: extractText(update.content) || rawOutput?.output_for_prompt,
  });
  if (!tool) return [];
  if (tool.status) tool.status = normalizeToolStatus(tool.status);
  return [{ type: "tool", tool }];
}
