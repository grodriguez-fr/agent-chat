import { normalizeToolStatus, type AgentToolActivity, type AgentToolDiff } from "../core/index.js";
import { isRecord, type AgentToolUpdate, type JsonRecord, type ParseStreamOptions } from "./events.js";

export function isMeaningfulToolTitle(title: string | undefined | null): boolean {
  return Boolean(title?.trim() && !["outil", "tool", "other", "unknown"].includes(title.trim().toLowerCase()));
}

function diffsFrom(value: unknown): AgentToolDiff[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(isRecord).flatMap((item) => {
    if (typeof item.path !== "string" || !item.path) return [];
    const diff: AgentToolDiff = { path: item.path };
    if (typeof item.oldText === "string") diff.oldText = item.oldText;
    if (typeof item.newText === "string") diff.newText = item.newText;
    if (typeof item.added === "number") diff.added = item.added;
    if (typeof item.removed === "number") diff.removed = item.removed;
    return [diff];
  });
}

export function parseToolUpdate(value: JsonRecord, options: ParseStreamOptions = {}): AgentToolUpdate | null {
  if (typeof value.id !== "string" || !value.id) return null;
  const tool: AgentToolUpdate = { id: value.id };
  for (const key of ["kind", "detail", "description", "command", "output", "path"] as const) {
    if (typeof value[key] === "string") tool[key] = value[key];
  }
  if (typeof value.status === "string") tool.status = options.preserveToolStatuses ? value.status : normalizeToolStatus(value.status);
  const title = typeof value.title === "string" ? value.title.trim() : undefined;
  if (isMeaningfulToolTitle(title)) tool.title = options.preserveToolTitles ? title : title?.replaceAll("_", " ");
  else if (isMeaningfulToolTitle(tool.kind)) tool.title = tool.kind;
  const diffs = diffsFrom(value.diffs);
  if (diffs) tool.diffs = diffs;
  return tool;
}

export function mergeAgentToolUpdate(previous: AgentToolActivity | undefined, update: AgentToolUpdate): AgentToolActivity {
  const defined = Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined));
  return {
    ...previous,
    ...defined,
    id: update.id,
    title: update.title || previous?.title || "Outil",
    status: update.status ? normalizeToolStatus(update.status) : previous?.status ?? "pending",
  };
}
