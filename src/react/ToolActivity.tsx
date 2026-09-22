import { useState } from "react";
import { Brain, Check, ChevronDown, ChevronRight, CircleAlert, FilePenLine, FileSearch, Globe, LoaderCircle, Terminal, Wrench, X } from "lucide-react";
import type { AgentChatSlots, AgentMessage, AgentMessagePart, AgentToolActivity } from "../core/index.js";
import { AgentMarkdown } from "./Markdown.js";

const states = { pending: "En attente", running: "En cours", completed: "Terminé", failed: "Échec", cancelled: "Annulé" };
type Action = { ongoing: string; done: string; icon: typeof Wrench };

/** Common tool labels live in the package so each application gets the same presentation. */
export function toolAction(tool: AgentToolActivity): Action {
  const name = `${tool.kind ?? ""} ${tool.title}`.toLowerCase();
  if (/list[_ -]?(offres|offers|jobs)/.test(name)) return { ongoing: "Consulte les offres", done: "Offres consultées", icon: FileSearch };
  if (/show[_ -]?(offre|offer|job)/.test(name)) return { ongoing: "Examine une offre", done: "Offre examinée", icon: FileSearch };
  if (/next[_ -]?action/.test(name)) return { ongoing: "Cherche la prochaine action", done: "Prochaine action recherchée", icon: FileSearch };
  if (/criter|criteria/.test(name)) return { ongoing: "Vérifie les critères", done: "Critères vérifiés", icon: FileSearch };
  if (/\bgrep\b|\brg\b|ripgrep|glob|search|find/.test(name)) return { ongoing: "Recherche dans les fichiers", done: "Recherche terminée", icon: FileSearch };
  if (/edit|write|replace|patch|diff/.test(name) || tool.diffs?.length) return { ongoing: "Modifie les fichiers", done: "Fichiers modifiés", icon: FilePenLine };
  if (/read|open|cat|file/.test(name) || tool.path) return { ongoing: "Lit un fichier", done: "Fichier consulté", icon: FileSearch };
  if (/web|browse|fetch|url|http/.test(name)) return { ongoing: "Consulte le web", done: "Page consultée", icon: Globe };
  if (/terminal|execute|command|bash|shell|exec/.test(name) || tool.command) return { ongoing: "Exécute une commande", done: "Commande exécutée", icon: Terminal };
  if (/analys|propos/.test(name)) return { ongoing: "Prépare une analyse", done: "Analyse préparée", icon: Brain };
  return { ongoing: "Explore les informations", done: "Informations consultées", icon: Wrench };
}

function shortTarget(tool: AgentToolActivity) {
  const path = tool.path?.replaceAll("\\", "/");
  if (path) return path.split("/").at(-1);
  const description = tool.detail?.replace(/\s+/g, " ").trim();
  return description && description.length <= 100 ? description : undefined;
}

/** One tool call as a flat row (ChatGPT style): no card, detail unfolds inline. */
export function ToolRow({ tool, slots }: { tool: AgentToolActivity; slots?: AgentChatSlots }) {
  const [open, setOpen] = useState(false);
  const action = toolAction(tool);
  const Icon = action.icon;
  const Status = tool.status === "running" ? LoaderCircle : tool.status === "completed" ? Check : tool.status === "cancelled" ? X : CircleAlert;
  const details = slots?.renderToolDetail?.(tool);
  const hasDetail = Boolean(details || tool.detail || tool.command || tool.output || tool.path || tool.diffs?.length);
  const label = tool.status === "running" || tool.status === "pending" ? action.ongoing : action.done;
  const target = shortTarget(tool);
  return <div className={`agent-chat__activity-item agent-chat__activity-item--${tool.status}`}>
    <button type="button" className="agent-chat__activity-item-head" onClick={() => { if (hasDetail) setOpen(!open); }} aria-expanded={hasDetail ? open : undefined} aria-label={`${label}${target ? ` — ${target}` : ""}`} title={states[tool.status]} disabled={!hasDetail}>
      <span className="agent-chat__activity-item-chevron" aria-hidden>{hasDetail && (open ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}</span>
      <span className="agent-chat__activity-item-icon"><Icon size={14} aria-hidden /></span>
      <span className="agent-chat__activity-item-label">{label}</span>
      {target && <span className="agent-chat__activity-item-target" title={tool.path ?? tool.detail ?? undefined}>{target}</span>}
      <span className="agent-chat__activity-item-status"><Status size={12} className={tool.status === "running" ? "is-spinning" : ""} aria-hidden />{tool.status !== "completed" && <span>{states[tool.status]}</span>}</span>
    </button>
    {open && hasDetail && <div className="agent-chat__activity-item-detail">{details ?? <>
      <span className="agent-chat__activity-item-raw">{tool.title}</span>
      {tool.detail && <p>{tool.detail}</p>}{tool.path && <p>{tool.path}</p>}
      {tool.command && <pre><code>{tool.command}</code></pre>}{tool.output && <pre><code>{tool.output}</code></pre>}
      {tool.diffs?.map((diff, index) => <details key={`${diff.path}-${index}`} className="agent-chat__diff">
        <summary>{diff.path}<span>+{diff.added ?? 0} −{diff.removed ?? 0}</span></summary>
        {diff.oldText && <pre className="agent-chat__diff-old"><code>{diff.oldText}</code></pre>}
        {diff.newText && <pre className="agent-chat__diff-new"><code>{diff.newText}</code></pre>}
      </details>)}
    </>}</div>}
  </div>;
}

function groupLabel(tools: AgentToolActivity[], live: boolean): string {
  if (live) {
    const running = [...tools].reverse().find((tool) => tool.status === "running" || tool.status === "pending");
    return running ? `${toolAction(running).ongoing}…` : "Réfléchit à la demande…";
  }
  if (tools.length === 0) return "A réfléchi à la demande";
  if (tools.length === 1) return toolAction(tools[0]).done;
  return `${toolAction(tools[tools.length - 1]).done} · ${tools.length} outils`;
}

/** Consecutive tool/reasoning activity folded into one collapsible group. */
export function ToolActivity({ parts, slots, live = false }: { parts: AgentMessagePart[]; slots?: AgentChatSlots; live?: boolean }) {
  const [open, setOpen] = useState(false);
  const tools = parts.flatMap((part) => part.type === "tool" ? [part.tool] : []);
  return <div className="agent-chat__activity">
    <button type="button" className="agent-chat__activity-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
      {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      <Brain size={14} aria-hidden /><span className={live ? "agent-chat__activity-live" : undefined}>{groupLabel(tools, live)}</span>
    </button>
    {open && <div className="agent-chat__activity-details">{parts.map((part, index) => part.type === "tool"
      ? <ToolRow key={part.tool.id} tool={part.tool} slots={slots} />
      : part.type === "reasoning" && <div key={index} className="agent-chat__reasoning">{slots?.renderMarkdown?.(part.text, Boolean(part.streaming)) ?? <AgentMarkdown streaming={part.streaming}>{part.text}</AgentMarkdown>}</div>)}</div>}
  </div>;
}

function isActivityOnly(message: AgentMessage): boolean {
  if (!message.parts.length) return false;
  return message.parts.every((part) => part.type === "tool" || part.type === "reasoning");
}

function messageCommentary(message: AgentMessage): string {
  return message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
}

/** Default execution activity shared by page and panel consumers. */
export function ActivityFeed({ messages, live, slots }: { messages: AgentMessage[]; live: boolean; slots?: AgentChatSlots }) {
  const blocks: Array<{ key: string; parts: AgentMessagePart[]; live: boolean } | { key: string; commentary: string }> = [];
  let pending: AgentMessagePart[] = [];
  let pendingKey = "";
  let pendingLive = false;
  const flush = () => {
    if (!pending.length) return;
    blocks.push({ key: `activity-${pendingKey}`, parts: pending, live: pendingLive });
    pending = [];
    pendingLive = false;
  };
  messages.forEach((message, index) => {
    const isLast = index === messages.length - 1;
    const commentary = messageCommentary(message);
    if (isActivityOnly(message) && !commentary) {
      if (!pending.length) pendingKey = message.id;
      pending.push(...message.parts);
      if (live && isLast) pendingLive = true;
      return;
    }
    flush();
    const activity = message.parts.filter((part) => part.type === "tool" || part.type === "reasoning");
    if (activity.length > 0) blocks.push({ key: `activity-${message.id}`, parts: activity, live: live && isLast });
    if (commentary) blocks.push({ key: `commentary-${message.id}`, commentary });
  });
  flush();
  return <>{blocks.map((block) => "commentary" in block
    ? <div key={block.key} className="agent-chat__activity-commentary">{slots?.renderMarkdown?.(block.commentary, false) ?? <AgentMarkdown>{block.commentary}</AgentMarkdown>}</div>
    : <ToolActivity key={block.key} parts={block.parts} slots={slots} live={block.live} />)}</>;
}
