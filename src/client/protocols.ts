import { normalizeToolStatus, type AgentToolActivity } from "../core/index.js";

export type AgentClientEvent =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "tool"; tool: AgentToolActivity }
  | { type: "done" }
  | { type: "error"; message: string }
  | { type: "heartbeat" };

type JsonRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is JsonRecord => Boolean(value) && typeof value === "object" && !Array.isArray(value);

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
  } catch {
    return [];
  }
  if (isRecord(message.error)) return [{ type: "error", message: String(message.error.message ?? "Erreur agent") }];
  if (message.method === "ping") return [{ type: "heartbeat" }];
  if (message.method === "_x.ai/session/prompt_complete" || message.method === "x.ai/session/prompt_complete") return [{ type: "done" }];
  if (message.method !== "session/update" || !isRecord(message.params) || !isRecord(message.params.update)) return [];
  const update = message.params.update;
  const kind = String(update.sessionUpdate ?? "");
  if (kind === "agent_message_chunk" || kind === "agent_message" || kind === "message") {
    const text = extractText(update.content);
    return text ? [{ type: "text", text }] : [];
  }
  if (kind === "thought" || kind === "agent_thought_chunk") {
    const text = extractText(update.content);
    return text ? [{ type: "reasoning", text }] : [];
  }
  if (kind === "turn_completed") return [{ type: "done" }];
  if (kind === "tool_call" || kind === "tool_call_update") {
    const id = String(update.toolCallId ?? update.id ?? "tool");
    const meta = isRecord(update._meta) && isRecord(update._meta["x.ai/tool"]) ? update._meta["x.ai/tool"] : undefined;
    const rawOutput = isRecord(update.rawOutput) ? update.rawOutput : undefined;
    return [{
      type: "tool",
      tool: {
        id,
        title: String(meta?.name ?? update.title ?? update.kind ?? "Outil").replaceAll("_", " "),
        status: normalizeToolStatus(String(update.status ?? (kind === "tool_call" ? "pending" : "running"))),
        kind: typeof update.kind === "string" ? update.kind : undefined,
        detail: typeof update.description === "string" ? update.description : undefined,
        command: typeof update.command === "string" ? update.command : undefined,
        output: extractText(update.content) || (typeof rawOutput?.output_for_prompt === "string" ? rawOutput.output_for_prompt : undefined),
      },
    }];
  }
  return [];
}

export function parseAiSdkDataStream(raw: string): AgentClientEvent[] {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const events: AgentClientEvent[] = [];
  for (const line of lines) {
    const prefix = line.slice(0, 2);
    const payload = line.slice(2);
    if (prefix === "0:" || prefix === "g:") {
      try {
        const text = JSON.parse(payload) as unknown;
        if (typeof text === "string" && text) events.push({ type: prefix === "0:" ? "text" : "reasoning", text });
      } catch { /* incomplete stream line */ }
      continue;
    }
    if (prefix === "3:") {
      try {
        const value = JSON.parse(payload) as unknown;
        events.push({ type: "error", message: isRecord(value) ? String(value.message ?? "Erreur agent") : String(value) });
      } catch { events.push({ type: "error", message: payload }); }
      continue;
    }
    if (prefix === "d:") { events.push({ type: "done" }); continue; }
    if (prefix !== "2:") continue;
    try {
      const parsed = JSON.parse(payload) as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const value of items) {
        if (!isRecord(value)) continue;
        if (value.type === "heartbeat") { events.push({ type: "heartbeat" }); continue; }
        if (value.type !== "tool-status") continue;
        events.push({ type: "tool", tool: {
          id: String(value.id ?? "tool"),
          title: String(value.title ?? value.kind ?? "Outil").replaceAll("_", " "),
          status: normalizeToolStatus(typeof value.status === "string" ? value.status : undefined),
          kind: typeof value.kind === "string" ? value.kind : undefined,
          detail: typeof value.detail === "string" ? value.detail : undefined,
          command: typeof value.command === "string" ? value.command : undefined,
          output: typeof value.output === "string" ? value.output : undefined,
          path: typeof value.path === "string" ? value.path : undefined,
        } });
      }
    } catch { /* incomplete stream line */ }
  }
  return events;
}
