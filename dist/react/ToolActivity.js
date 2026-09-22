import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Brain, Check, ChevronDown, ChevronRight, CircleAlert, FilePenLine, FileSearch, Globe, LoaderCircle, Terminal, Wrench, X } from "lucide-react";
import { AgentMarkdown } from "./Markdown.js";
const states = { pending: "En attente", running: "En cours", completed: "Terminé", failed: "Échec", cancelled: "Annulé" };
/** Common tool labels live in the package so each application gets the same presentation. */
export function toolAction(tool) {
    const name = `${tool.kind ?? ""} ${tool.title}`.toLowerCase();
    if (/list[_ -]?(offres|offers|jobs)/.test(name))
        return { ongoing: "Consulte les offres", done: "Offres consultées", icon: FileSearch };
    if (/show[_ -]?(offre|offer|job)/.test(name))
        return { ongoing: "Examine une offre", done: "Offre examinée", icon: FileSearch };
    if (/next[_ -]?action/.test(name))
        return { ongoing: "Cherche la prochaine action", done: "Prochaine action recherchée", icon: FileSearch };
    if (/criter|criteria/.test(name))
        return { ongoing: "Vérifie les critères", done: "Critères vérifiés", icon: FileSearch };
    if (/\bgrep\b|\brg\b|ripgrep|glob|search|find/.test(name))
        return { ongoing: "Recherche dans les fichiers", done: "Recherche terminée", icon: FileSearch };
    if (/edit|write|replace|patch|diff/.test(name) || tool.diffs?.length)
        return { ongoing: "Modifie les fichiers", done: "Fichiers modifiés", icon: FilePenLine };
    if (/read|open|cat|file/.test(name) || tool.path)
        return { ongoing: "Lit un fichier", done: "Fichier consulté", icon: FileSearch };
    if (/web|browse|fetch|url|http/.test(name))
        return { ongoing: "Consulte le web", done: "Page consultée", icon: Globe };
    if (/terminal|execute|command|bash|shell|exec/.test(name) || tool.command)
        return { ongoing: "Exécute une commande", done: "Commande exécutée", icon: Terminal };
    if (/analys|propos/.test(name))
        return { ongoing: "Prépare une analyse", done: "Analyse préparée", icon: Brain };
    return { ongoing: "Explore les informations", done: "Informations consultées", icon: Wrench };
}
function shortTarget(tool) {
    const path = tool.path?.replaceAll("\\", "/");
    if (path)
        return path.split("/").at(-1);
    const description = tool.detail?.replace(/\s+/g, " ").trim();
    return description && description.length <= 100 ? description : undefined;
}
export function ToolRow({ tool, slots }) {
    const [open, setOpen] = useState(false);
    const action = toolAction(tool);
    const Icon = action.icon;
    const Status = tool.status === "running" ? LoaderCircle : tool.status === "completed" ? Check : tool.status === "cancelled" ? X : CircleAlert;
    const details = slots?.renderToolDetail?.(tool);
    const hasDetail = Boolean(details || tool.detail || tool.command || tool.output || tool.path || tool.diffs?.length);
    const label = tool.status === "running" || tool.status === "pending" ? action.ongoing : action.done;
    return _jsxs("div", { className: `agent-chat__activity-item agent-chat__activity-item--${tool.status}`, children: [_jsx("div", { className: "agent-chat__activity-item-icon", children: _jsx(Icon, { size: 15, "aria-hidden": true }) }), _jsxs("div", { className: "agent-chat__activity-item-main", children: [_jsxs("div", { className: "agent-chat__activity-item-head", children: [_jsx("span", { children: label }), _jsxs("small", { children: [_jsx(Status, { size: 12, className: tool.status === "running" ? "is-spinning" : "", "aria-hidden": true }), states[tool.status]] })] }), shortTarget(tool) && _jsx("span", { className: "agent-chat__activity-item-target", title: tool.path ?? tool.detail, children: shortTarget(tool) }), hasDetail && _jsxs("button", { type: "button", className: "agent-chat__activity-item-more", onClick: () => setOpen(!open), "aria-expanded": open, children: [open ? "Masquer les détails" : "Voir les détails", open ? _jsx(ChevronDown, { size: 12 }) : _jsx(ChevronRight, { size: 12 })] }), open && _jsx("div", { className: "agent-chat__activity-item-detail", children: details ?? _jsxs(_Fragment, { children: [_jsx("span", { className: "agent-chat__activity-item-raw", children: tool.title }), tool.detail && _jsx("p", { children: tool.detail }), tool.path && _jsx("p", { children: tool.path }), tool.command && _jsx("pre", { children: _jsx("code", { children: tool.command }) }), tool.output && _jsx("pre", { children: _jsx("code", { children: tool.output }) }), tool.diffs?.map((diff, index) => _jsxs("details", { className: "agent-chat__diff", children: [_jsxs("summary", { children: [diff.path, _jsxs("span", { children: ["+", diff.added ?? 0, " \u2212", diff.removed ?? 0] })] }), diff.oldText && _jsx("pre", { className: "agent-chat__diff-old", children: _jsx("code", { children: diff.oldText }) }), diff.newText && _jsx("pre", { className: "agent-chat__diff-new", children: _jsx("code", { children: diff.newText }) })] }, `${diff.path}-${index}`))] }) })] })] });
}
export function ToolActivity({ parts, slots, live = false }) {
    const [open, setOpen] = useState(false);
    const tools = parts.flatMap((part) => part.type === "tool" ? [part.tool] : []);
    const running = [...tools].reverse().find((tool) => tool.status === "running" || tool.status === "pending");
    const label = live ? running ? `${toolAction(running).ongoing}…` : "Réfléchit à la demande…" : tools.length > 1 ? "A vérifié les informations utiles" : tools.length ? toolAction(tools[0]).done : "A réfléchi à la demande";
    return _jsxs("div", { className: "agent-chat__activity", children: [_jsxs("button", { type: "button", className: "agent-chat__activity-toggle", onClick: () => setOpen(!open), "aria-expanded": open, children: [open ? _jsx(ChevronDown, { size: 14 }) : _jsx(ChevronRight, { size: 14 }), _jsx(Brain, { size: 14, "aria-hidden": true }), _jsx("span", { className: live ? "agent-chat__activity-live" : undefined, children: label })] }), open && _jsx("div", { className: "agent-chat__activity-details", children: parts.map((part, index) => part.type === "tool"
                    ? _jsx(ToolRow, { tool: part.tool, slots: slots }, part.tool.id)
                    : part.type === "reasoning" && _jsx("div", { className: "agent-chat__reasoning", children: slots?.renderMarkdown?.(part.text, Boolean(part.streaming)) ?? _jsx(AgentMarkdown, { streaming: part.streaming, children: part.text }) }, index)) })] });
}
/** Default execution activity shared by page and panel consumers. */
export function ActivityFeed({ messages, live, slots }) {
    return _jsx(_Fragment, { children: messages.map((message, index) => {
            const activity = message.parts.filter((part) => part.type === "tool" || part.type === "reasoning");
            const commentary = message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
            return _jsxs("div", { children: [activity.length > 0 && _jsx(ToolActivity, { parts: activity, slots: slots, live: live && index === messages.length - 1 }), commentary && _jsx("div", { className: "agent-chat__activity-commentary", children: slots?.renderMarkdown?.(commentary, false) ?? _jsx(AgentMarkdown, { children: commentary }) })] }, message.id);
        }) });
}
//# sourceMappingURL=ToolActivity.js.map