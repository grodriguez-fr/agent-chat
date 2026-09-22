import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Copy, RotateCcw } from "lucide-react";
import { buildThreadBlocks, formatDuration, messageText, type AgentChatController, type AgentChatSlots, type AgentMessage, type AgentMessagePart } from "../core/index.js";
import { AgentMarkdown } from "./Markdown.js";
import { ActivityFeed, ToolActivity } from "./ToolActivity.js";

function useElapsed(live: boolean, startedAt?: number | null, fallback: number | null = null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [live]);
  return live && startedAt != null ? Math.max(0, now - startedAt) : fallback;
}

function executionDuration(milliseconds: number): string {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  if (seconds < 60) return `${seconds} seconde${seconds === 1 ? "" : "s"}`;
  return formatDuration(milliseconds);
}

function partGroups(parts: AgentMessagePart[]) {
  const groups: AgentMessagePart[][] = [];
  for (const part of parts) {
    const activity = part.type === "tool" || part.type === "reasoning";
    const last = groups.at(-1);
    if (activity && last?.every((entry) => entry.type === "tool" || entry.type === "reasoning")) last.push(part);
    else groups.push([part]);
  }
  return groups;
}

function MessageContent({ message, slots }: { message: AgentMessage; slots?: AgentChatSlots }) {
  return <div className={message.role === "user" ? "agent-chat__user-bubble" : "agent-chat__assistant-content"}>
    {partGroups(message.parts).map((group, index) => {
      const part = group[0];
      if (part.type === "tool" || part.type === "reasoning") return <ToolActivity key={index} parts={group} slots={slots} />;
      if (part.type === "text") {
        if (message.role === "user") return <span key={index}>{part.text}</span>;
        return <div key={index}>{slots?.renderMarkdown?.(part.text, Boolean(part.streaming)) ?? <AgentMarkdown streaming={part.streaming}>{part.text}</AgentMarkdown>}</div>;
      }
      if (part.type === "attachment") return <a key={part.attachment.id} className="agent-chat__attachment" href={part.attachment.url} target="_blank" rel="noreferrer">{part.attachment.name}</a>;
      return <span key={part.id}>{slots?.renderMessageSlot?.(part.id, part.value)}</span>;
    })}
  </div>;
}

function MessageRow({ message, controller, slots }: { message: AgentMessage; controller: AgentChatController; slots?: AgentChatSlots }) {
  const text = messageText(message);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  };
  return <div className={`agent-chat__message agent-chat__message--${message.role}`} data-agent-user-message={message.role === "user" ? "true" : undefined}>
    <MessageContent message={message} slots={slots} />
    {slots?.renderMessageActions ? slots.renderMessageActions(message) : text && <div className="agent-chat__message-actions">
      <button type="button" onClick={() => void copy()} aria-label={copied ? "Copié" : "Copier"}><Copy size={13} /></button>
      {controller.retryMessage && <button type="button" disabled={controller.status === "streaming"} onClick={() => controller.retryMessage?.(message.sourceId ?? message.id)} aria-label="Réessayer"><RotateCcw size={13} /></button>}
      {copyError && <span role="status">Copie indisponible</span>}
    </div>}
  </div>;
}

function ExecutionGroup({ block, controller, slots }: { block: Extract<ReturnType<typeof buildThreadBlocks>[number], { type: "execution" }>; controller: AgentChatController; slots?: AgentChatSlots }) {
  const [open, setOpen] = useState(block.live);
  const elapsed = useElapsed(block.live, controller.streamStartedAt, block.durationMs);
  useEffect(() => setOpen(block.live), [block.live]);
  const label = elapsed == null ? (block.live ? "Réflexion en cours…" : "Durée d’exécution : —") : block.live ? `Réflexion en cours depuis ${executionDuration(elapsed)}` : `Durée d’exécution : ${executionDuration(elapsed)}`;
  const hasActivity = block.messages.length > 0;
  return <div className="agent-chat__execution">
    {(hasActivity || block.live || elapsed != null) && (block.live
      ? <div className="agent-chat__execution-header" role="status"><span>{label}</span></div>
      : <button type="button" className="agent-chat__execution-header" disabled={!hasActivity} onClick={() => setOpen(!open)} aria-expanded={hasActivity ? open : undefined}><span>{label}</span>{hasActivity && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}</button>)}
    {open && hasActivity && <div className="agent-chat__execution-body">{slots?.renderActivity?.(block.messages, block.live) ?? <ActivityFeed messages={block.messages} live={block.live} slots={slots} />}</div>}
    {block.finalMessage && <div className="agent-chat__final"><MessageRow message={block.finalMessage} controller={controller} slots={slots} /></div>}
  </div>;
}

export function AgentTimeline({ controller, slots }: { controller: AgentChatController; slots?: AgentChatSlots }) {
  const blocks = useMemo(() => buildThreadBlocks(controller.messages, controller.status === "streaming"), [controller.messages, controller.status]);
  return <div className="agent-chat__thread">{blocks.map((block) => block.type === "message" ? <MessageRow key={block.message.id} message={block.message} controller={controller} slots={slots} /> : <ExecutionGroup key={block.id} block={block} controller={controller} slots={slots} />)}{slots?.afterMessages}</div>;
}
