import { normalizeToolStatus } from "./timeline.js";
import type { AgentMessage, AgentRole, AgentToolDiff } from "./types.js";

/** Presentation adapter for the existing Talos / Job Finder stores. No persistence. */
export type LegacyAgentMessage = {
  id: string; role: AgentRole; content: string; kind?: string;
  streaming?: boolean; queued?: boolean; toolCallId?: string; toolName?: string;
  status?: string; description?: string; command?: string; output?: string;
  path?: string; diffs?: AgentToolDiff[];
  createdAt?: number; startedAt?: number; endedAt?: number; durationMs?: number;
};

export function fromLegacyMessages(messages: LegacyAgentMessage[]): AgentMessage[] {
  return messages.map((message) => {
    const parts: AgentMessage["parts"] = [];
    if (message.role === "tool") parts.push({ type: "tool", tool: {
      id: message.toolCallId ?? message.id, title: message.toolName ?? "Outil",
      status: normalizeToolStatus(message.status), kind: message.kind,
      detail: message.description, command: message.command, output: message.output,
      path: message.path, diffs: message.diffs,
      startedAt: message.startedAt, endedAt: message.endedAt,
    } });
    else if (message.kind === "thought") parts.push({ type: "reasoning", text: message.content, streaming: message.streaming });
    else if (message.kind !== "worked" && message.content) parts.push({ type: "text", text: message.content, streaming: message.streaming });
    return { id: message.id, role: message.role, parts, queued: message.queued,
      createdAt: message.createdAt, endedAt: message.endedAt,
      durationMs: message.kind === "worked" ? message.durationMs : undefined };
  });
}
