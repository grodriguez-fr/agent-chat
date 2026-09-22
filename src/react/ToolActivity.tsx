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

export function ToolRow({ tool, slots }: { tool: AgentToolActivity; slots?: AgentChatSlots }) {
  const [open, setOpen] = useState(false);
  const action = toolAction(tool);
  const Icon = action.icon;
  const Status = tool.status === "running" ? LoaderCircle : tool.status === "completed" ? Check : tool.status === "cancelled" ? X : CircleAlert;
  const details = slots?.renderToolDetail?.(tool);
  const hasDetail = Boolean(details || tool.detail || tool.command || tool.output || tool.path || tool.diffs?.length);
  const label = tool.status === "running" || tool.status === "pending" ? action.ongoing : action.done;
  return <div className={`agent-chat__activity-item agent-chat__activity-item--${tool.status}`}>
    <div className="agent-chat__activity-item-icon"><Icon size={15} aria-hidden /></div>
    <div className="agent-chat__activity-item-main">
      <div className="agent-chat__activity-item-head"><span>{label}</span><small><Status size={12} className={tool.status === "running" ? "is-spinning" : ""} aria-hidden />{states[tool.status]}</small></div>
      {shortTarget(tool) && <span className="agent-chat__activity-item-target" title={tool.path ?? tool.detail}>{shortTarget(tool)}</span>}
      {hasDetail && <button type="button" className="agent-chat__activity-item-more" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? "Masquer les détails" : "Voir les détails"}{open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>}
      {open && <div className="agent-chat__activity-item-detail">{details ?? <>
        <span className="agent-chat__activity-item-raw">{tool.title}</span>
        {tool.detail && <p>{tool.detail}</p>}{tool.path && <p>{tool.path}</p>}
        {tool.command && <pre><code>{tool.command}</code></pre>}{tool.output && <pre><code>{tool.output}</code></pre>}
        {tool.diffs?.map((diff, index) => <details key={`${diff.path}-${index}`} className="agent-chat__diff">
          <summary>{diff.path}<span>+{diff.added ?? 0} −{diff.removed ?? 0}</span></summary>
          {diff.oldText && <pre className="agent-chat__diff-old"><code>{diff.oldText}</code></pre>}
          {diff.newText && <pre className="agent-chat__diff-new"><code>{diff.newText}</code></pre>}
        </details>)}
      </>}</div>}
    </div>
  </div>;
}

export function ToolActivity({ parts, slots, live = false }: { parts: AgentMessagePart[]; slots?: AgentChatSlots; live?: boolean }) {
  const [open, setOpen] = useState(false);
  const tools = parts.flatMap((part) => part.type === "tool" ? [part.tool] : []);
  const running = [...tools].reverse().find((tool) => tool.status === "running" || tool.status === "pending");
  const label = live ? running ? `${toolAction(running).ongoing}…` : "Réfléchit à la demande…" : tools.length > 1 ? "A vérifié les informations utiles" : tools.length ? toolAction(tools[0]).done : "A réfléchi à la demande";
  return <div className="agent-chat__activity">
    <button type="button" className="agent-chat__activity-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
      {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      <Brain size={14} aria-hidden /><span className={live ? "agent-chat__activity-live" : undefined}>{label}</span>
    </button>
    {open && <div className="agent-chat__activity-details">{parts.map((part, index) => part.type === "tool"
      ? <ToolRow key={part.tool.id} tool={part.tool} slots={slots} />
      : part.type === "reasoning" && <div key={index} className="agent-chat__reasoning">{slots?.renderMarkdown?.(part.text, Boolean(part.streaming)) ?? <AgentMarkdown streaming={part.streaming}>{part.text}</AgentMarkdown>}</div>)}</div>}
  </div>;
}

/** Default execution activity shared by page and panel consumers. */
export function ActivityFeed({ messages, live, slots }: { messages: AgentMessage[]; live: boolean; slots?: AgentChatSlots }) {
  return <>{messages.map((message, index) => {
    const activity = message.parts.filter((part) => part.type === "tool" || part.type === "reasoning");
    const commentary = message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
    return <div key={message.id}>
      {activity.length > 0 && <ToolActivity parts={activity} slots={slots} live={live && index === messages.length - 1} />}
      {commentary && <div className="agent-chat__activity-commentary">{slots?.renderMarkdown?.(commentary, false) ?? <AgentMarkdown>{commentary}</AgentMarkdown>}</div>}
    </div>;
  })}</>;
}
