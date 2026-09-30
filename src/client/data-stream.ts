import { isRecord, type AgentClientEvent, type JsonRecord, type ParseStreamOptions } from "./events.js";
import { parseToolUpdate } from "./tool-updates.js";

function dataEvent(value: JsonRecord, options: ParseStreamOptions): AgentClientEvent[] {
  if (value.type === "heartbeat") return [{ type: "heartbeat" }];
  if (value.type === "usage") {
    const cost = value.estimatedCostUsd;
    return [{ type: "usage", ...(typeof cost === "number" && Number.isFinite(cost) && cost >= 0 ? { estimatedCostUsd: cost } : {}) }];
  }
  if (value.type === "plan" && Array.isArray(value.entries)) {
    const entries = value.entries.filter(isRecord).flatMap((entry) => typeof entry.content === "string" && entry.content
      ? [{ content: entry.content, ...(typeof entry.status === "string" ? { status: entry.status } : {}), ...(typeof entry.priority === "string" ? { priority: entry.priority } : {}) }]
      : []);
    return [{ type: "plan", entries }];
  }
  if (value.type !== "tool-status") return [];
  const tool = parseToolUpdate(value, options);
  return tool ? [{ type: "tool", tool }] : [];
}

function parseLine(line: string, options: ParseStreamOptions): AgentClientEvent[] {
  const prefix = line.slice(0, 2);
  if (!["0:", "g:", "2:", "3:", "d:"].includes(prefix)) return [];
  let value: unknown;
  try { value = JSON.parse(line.slice(2)); }
  catch {
    if (options.strict) throw new Error("Flux du gateway invalide (" + prefix + ").");
    return prefix === "3:" ? [{ type: "error", message: line.slice(2) }] : [];
  }
  if (prefix === "0:" || prefix === "g:") return typeof value === "string" && value
    ? [{ type: prefix === "0:" ? "text" : "reasoning", text: value }] : [];
  if (prefix === "3:") return [{ type: "error", message: isRecord(value) ? String(value.message ?? "Erreur agent") : String(value) }];
  if (prefix === "d:") {
    if (!isRecord(value)) {
      if (options.strict) throw new Error("Fin du flux gateway invalide.");
      return [];
    }
    const finishReason = typeof value.finishReason === "string" ? value.finishReason : undefined;
    return [{ type: "done", ...(finishReason ? { finishReason } : {}) }];
  }
  return (Array.isArray(value) ? value : [value]).filter(isRecord).flatMap((item) => dataEvent(item, options));
}

/** Parse complete lines; use AgentDataStreamParser for network chunks. */
export function parseAiSdkDataStream(raw: string, options: ParseStreamOptions = {}): AgentClientEvent[] {
  return raw.split(/\r?\n/).filter(Boolean).flatMap((line) => parseLine(line, options));
}

export class DataStreamLineBuffer {
  private buffer = "";
  constructor(private readonly maxLineChars = 1_000_000) {}
  push(chunk: string): string[] {
    this.buffer += chunk;
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() ?? "";
    if ([...lines, this.buffer].some((line) => line.length > this.maxLineChars)) throw new Error("Ligne de réponse du gateway trop longue.");
    return lines.map((line) => line.replace(/\r$/, ""));
  }
  flush(): string[] {
    const rest = this.buffer.replace(/\r$/, "");
    this.buffer = "";
    return rest ? [rest] : [];
  }
}

export class AgentDataStreamParser {
  private readonly buffer = new DataStreamLineBuffer();
  constructor(private readonly options: ParseStreamOptions = {}) {}
  push(chunk: string): AgentClientEvent[] { return this.buffer.push(chunk).flatMap((line) => parseLine(line, this.options)); }
  flush(): AgentClientEvent[] { return this.buffer.flush().flatMap((line) => parseLine(line, this.options)); }
}

export type ReadAgentStreamOptions = {
  signal?: AbortSignal;
  onEvent?: (event: AgentClientEvent) => void | Promise<void>;
  onLine?: (line: string) => void | Promise<void>;
  requireDone?: boolean;
};

/** Shared terminal validation and UTF-8/chunk buffering for all server consumers. */
export async function readAgentDataStream(body: ReadableStream<Uint8Array> | null, options: ReadAgentStreamOptions = {}): Promise<void> {
  if (!body) throw new Error("Le gateway n'a renvoyé aucun flux.");
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const buffer = new DataStreamLineBuffer();
  let terminal = false;
  let failure = "";
  const processLine = async (line: string) => {
    if (!line.trim()) return;
    const events = parseAiSdkDataStream(line, { strict: true, preserveToolTitles: true });
    if (terminal && events.some((event) => event.type !== "heartbeat")) throw new Error("Événement reçu après la fin du flux gateway.");
    for (const event of events) {
      if (event.type === "error") failure = event.message;
      if (event.type === "done") {
        terminal = true;
        if (["error", "cancelled", "canceled"].includes(event.finishReason ?? "")) failure ||= "Tour du gateway terminé : " + event.finishReason;
      }
      await options.onEvent?.(event);
    }
    await options.onLine?.(line);
  };
  const abortRead = () => { void reader.cancel(options.signal?.reason).catch(() => {}); };
  options.signal?.addEventListener("abort", abortRead, { once: true });
  try {
    options.signal?.throwIfAborted();
    while (true) {
      const { done, value } = await reader.read();
      options.signal?.throwIfAborted();
      if (done) break;
      for (const line of buffer.push(decoder.decode(value, { stream: true }))) await processLine(line);
    }
    for (const line of [...buffer.push(decoder.decode()), ...buffer.flush()]) await processLine(line);
    if (failure) throw new Error(failure);
    if (options.requireDone !== false && !terminal) throw new Error("Flux du gateway interrompu avant la fin du tour.");
  } catch (error) {
    await reader.cancel(error).catch(() => {});
    throw error;
  } finally {
    options.signal?.removeEventListener("abort", abortRead);
    reader.releaseLock();
  }
}
