import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, CircleAlert, Clock3, Copy, LoaderCircle, RotateCcw, Wrench } from "lucide-react";
import { buildThreadBlocks, formatDuration, messageText, type AgentChatController, type AgentChatSlots, type AgentMessage, type AgentToolActivity } from "../core/index.js";
import { AgentMarkdown } from "./Markdown.js";

function useElapsed(live: boolean, startedAt?: number | null, fallback = 0) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [live]);
  return live && startedAt ? Math.max(0, now - startedAt) : fallback;
}

function ToolRow({ tool, slots }: { tool: AgentToolActivity; slots?: AgentChatSlots }) {
  const [open, setOpen] = useState(tool.status === "running");
  const hasDetail = Boolean(tool.detail || tool.command || tool.output || tool.diffs?.length || slots?.renderToolDetail);
  const Icon = tool.status === "completed" ? Check : tool.status === "failed" ? CircleAlert : tool.status === "running" ? LoaderCircle : Wrench;
  return <div className={`agent-chat__tool agent-chat__tool--${tool.status}`}>
    <button type="button" onClick={() => hasDetail && setOpen((value) => !value)} aria-expanded={hasDetail ? open : undefined}>
      {hasDetail ? open ? <ChevronDown size={14} /> : <ChevronRight size={14} /> : <span className="agent-chat__tool-spacer" />}
      <Icon size={15} className={tool.status === "running" ? "is-spinning" : ""} />
      <span>{tool.title}</span>
      <small>{tool.status === "running" ? "en cours" : tool.status === "completed" ? "terminé" : tool.status === "failed" ? "échec" : tool.status}</small>
    </button>
    {open && hasDetail && <div className="agent-chat__tool-detail">{slots?.renderToolDetail?.(tool) ?? <>{tool.detail && <p>{tool.detail}</p>}{tool.command && <pre><code>{tool.command}</code></pre>}{tool.output && <pre><code>{tool.output}</code></pre>}{tool.diffs?.map((diff) => <div key={diff.path} className="agent-chat__diff"><strong>{diff.path}</strong><span>+{diff.added ?? 0} −{diff.removed ?? 0}</span></div>)}</>}</div>}
  </div>;
}

function MessageContent({ message, slots, finalOnly = false }: { message: AgentMessage; slots?: AgentChatSlots; finalOnly?: boolean }) {
  const isUser = message.role === "user";
  return <div className={isUser ? "agent-chat__user-bubble" : "agent-chat__assistant-content"}>
    {message.parts.map((part, index) => {
      if (part.type === "text") return slots?.renderMarkdown ? <div key={index}>{slots.renderMarkdown(part.text, Boolean(part.streaming))}</div> : <AgentMarkdown key={index} streaming={part.streaming}>{part.text}</AgentMarkdown>;
      if (part.type === "reasoning") return finalOnly ? null : <details key={index} className="agent-chat__reasoning" open={part.streaming}><summary>Réflexion</summary>{slots?.renderMarkdown ? slots.renderMarkdown(part.text, Boolean(part.streaming)) : <AgentMarkdown streaming={part.streaming}>{part.text}</AgentMarkdown>}</details>;
      if (part.type === "tool") return finalOnly ? null : <ToolRow key={part.tool.id} tool={part.tool} slots={slots} />;
      if (part.type === "attachment") return <a key={part.attachment.id} className="agent-chat__attachment" href={part.attachment.url} target="_blank" rel="noreferrer">{part.attachment.name}</a>;
      return <span key={part.id}>{slots?.renderMessageSlot?.(part.id, part.value)}</span>;
    })}
  </div>;
}

function MessageRow({ message, controller, slots, finalOnly = false }: { message: AgentMessage; controller: AgentChatController; slots?: AgentChatSlots; finalOnly?: boolean }) {
  const text = messageText(message);
  return <div className={`agent-chat__message agent-chat__message--${message.role}`} data-agent-user-message={message.role === "user" ? "true" : undefined}>
    <MessageContent message={message} slots={slots} finalOnly={finalOnly} />
    {text && <div className="agent-chat__message-actions"><button type="button" onClick={() => void navigator.clipboard?.writeText(text)} aria-label="Copier"><Copy size={13} /></button>{controller.retryMessage && <button type="button" onClick={() => controller.retryMessage?.(message.id)} aria-label="Réessayer"><RotateCcw size={13} /></button>}</div>}
  </div>;
}

function ExecutionGroup({ block, controller, slots }: { block: Extract<ReturnType<typeof buildThreadBlocks>[number], { type: "execution" }>; controller: AgentChatController; slots?: AgentChatSlots }) {
  const [open, setOpen] = useState(block.live);
  const elapsed = useElapsed(block.live, controller.streamStartedAt, block.durationMs ?? 0);
  useEffect(() => setOpen(block.live), [block.live]);
  const label = block.live ? `En cours depuis ${formatDuration(elapsed)}` : `Durée d’exécution : ${formatDuration(elapsed)}`;
  return <div className="agent-chat__execution">
    {block.live ? <div className="agent-chat__execution-header" role="status"><Clock3 size={14} /><span>{label}</span></div> : <button type="button" className="agent-chat__execution-header" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}<span>{label}</span></button>}
    {open && <div className="agent-chat__execution-body">{block.messages.map((message) => <MessageRow key={message.id} message={message} controller={controller} slots={slots} />)}</div>}
    {block.finalMessage && <div className="agent-chat__final"><MessageRow message={block.finalMessage} controller={controller} slots={slots} finalOnly /></div>}
  </div>;
}

export function AgentTimeline({ controller, slots }: { controller: AgentChatController; slots?: AgentChatSlots }) {
  const blocks = useMemo(() => buildThreadBlocks(controller.messages, controller.status === "streaming"), [controller.messages, controller.status]);
  return <div className="agent-chat__thread">{blocks.map((block) => block.type === "message" ? <MessageRow key={block.message.id} message={block.message} controller={controller} slots={slots} /> : <ExecutionGroup key={block.id} block={block} controller={controller} slots={slots} />)}{slots?.afterMessages}</div>;
}
