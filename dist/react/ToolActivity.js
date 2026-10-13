import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { ChatIcon } from "./icons.js";
import { AgentMarkdown } from "./Markdown.js";
const states = { pending: "En attente", running: "En cours", completed: "Terminé", failed: "Échec", cancelled: "Annulé" };
/** Common tool labels live in the package so each application gets the same presentation. */
export function toolAction(tool) {
    const name = `${tool.kind ?? ""} ${tool.title}`.toLowerCase();
    if (/list[_ -]?(offres|offers|jobs)/.test(name))
        return { ongoing: "Consulte les offres", done: "Offres consultées", icon: "file-search" };
    if (/show[_ -]?(offre|offer|job)/.test(name))
        return { ongoing: "Examine une offre", done: "Offre examinée", icon: "file-search" };
    if (/next[_ -]?action/.test(name))
        return { ongoing: "Cherche la prochaine action", done: "Prochaine action recherchée", icon: "file-search" };
    if (/criter|criteria/.test(name))
        return { ongoing: "Vérifie les critères", done: "Critères vérifiés", icon: "file-search" };
    if (/\bgrep\b|\brg\b|ripgrep|glob|search|find/.test(name))
        return { ongoing: "Recherche dans les fichiers", done: "Recherche terminée", icon: "file-search" };
    if (/edit|write|replace|patch|diff/.test(name) || tool.diffs?.length)
        return { ongoing: "Modifie les fichiers", done: "Fichiers modifiés", icon: "file-edit" };
    if (/read|open|cat|file/.test(name) || tool.path)
        return { ongoing: "Lit un fichier", done: "Fichier consulté", icon: "file-search" };
    if (/web|browse|fetch|url|http/.test(name))
        return { ongoing: "Consulte le web", done: "Page consultée", icon: "web" };
    if (/terminal|execute|command|bash|shell|exec/.test(name) || tool.command)
        return { ongoing: "Exécute une commande", done: "Commande exécutée", icon: "terminal" };
    if (/analys|propos/.test(name))
        return { ongoing: "Prépare une analyse", done: "Analyse préparée", icon: "thinking" };
    return { ongoing: "Explore les informations", done: "Informations consultées", icon: "tool" };
}
function shortTarget(tool) {
    const path = tool.path?.replaceAll("\\", "/");
    if (path)
        return path.split("/").at(-1);
    const description = tool.detail?.replace(/\s+/g, " ").trim();
    return description && description.length <= 100 ? description : undefined;
}
/** One tool call as a flat row (ChatGPT style): no card, detail unfolds inline. */
export function ToolRow({ tool, slots }) {
    const [open, setOpen] = useState(false);
    const action = toolAction(tool);
    const status = tool.status === "running" ? "spinner" : tool.status === "completed" ? "check" : tool.status === "cancelled" ? "close" : "error";
    const details = slots?.renderToolDetail?.(tool);
    const hasDetail = Boolean(details || tool.detail || tool.command || tool.output || tool.path || tool.diffs?.length);
    const label = tool.status === "running" || tool.status === "pending" ? action.ongoing : action.done;
    const target = shortTarget(tool);
    return _jsxs("div", { className: `agent-chat__activity-item agent-chat__activity-item--${tool.status}`, children: [_jsxs("button", { type: "button", className: "agent-chat__activity-item-head", onClick: () => { if (hasDetail)
                    setOpen(!open); }, "aria-expanded": hasDetail ? open : undefined, "aria-label": `${label}${target ? ` — ${target}` : ""}`, title: states[tool.status], disabled: !hasDetail, children: [_jsx("span", { className: "agent-chat__activity-item-chevron", "aria-hidden": true, children: hasDetail && (open ? _jsx(ChatIcon, { name: "chevron-down", size: 13 }) : _jsx(ChatIcon, { name: "chevron-right", size: 13 })) }), _jsx("span", { className: "agent-chat__activity-item-icon", children: _jsx(ChatIcon, { name: action.icon, size: 14 }) }), _jsx("span", { className: "agent-chat__activity-item-label", children: label }), target && _jsx("span", { className: "agent-chat__activity-item-target", title: tool.path ?? tool.detail ?? undefined, children: target }), _jsxs("span", { className: "agent-chat__activity-item-status", children: [_jsx(ChatIcon, { name: status, size: 12 }), tool.status !== "completed" && _jsx("span", { children: states[tool.status] })] })] }), open && hasDetail && _jsx("div", { className: "agent-chat__activity-item-detail", children: details ?? _jsxs(_Fragment, { children: [_jsx("span", { className: "agent-chat__activity-item-raw", children: tool.title }), tool.detail && _jsx("p", { children: tool.detail }), tool.path && _jsx("p", { children: tool.path }), tool.command && _jsx("pre", { children: _jsx("code", { children: tool.command }) }), tool.output && _jsx("pre", { children: _jsx("code", { children: tool.output }) }), tool.diffs?.map((diff, index) => _jsxs("details", { className: "agent-chat__diff", children: [_jsxs("summary", { children: [diff.path, _jsxs("span", { children: ["+", diff.added ?? 0, " \u2212", diff.removed ?? 0] })] }), diff.oldText && _jsx("pre", { className: "agent-chat__diff-old", children: _jsx("code", { children: diff.oldText }) }), diff.newText && _jsx("pre", { className: "agent-chat__diff-new", children: _jsx("code", { children: diff.newText }) })] }, `${diff.path}-${index}`))] }) })] });
}
function groupLabel(tools, live) {
    if (live) {
        const running = [...tools].reverse().find((tool) => tool.status === "running" || tool.status === "pending");
        return running ? `${toolAction(running).ongoing}…` : "Réfléchit à la demande…";
    }
    if (tools.length === 0)
        return "A réfléchi à la demande";
    if (tools.length === 1)
        return toolAction(tools[0]).done;
    return `${toolAction(tools[tools.length - 1]).done} · ${tools.length} outils`;
}
/** Consecutive tool/reasoning activity folded into one collapsible group. */
export function ToolActivity({ parts, slots, live = false }) {
    const [open, setOpen] = useState(false);
    const tools = parts.flatMap((part) => part.type === "tool" ? [part.tool] : []);
    return _jsxs("div", { className: "agent-chat__activity", children: [_jsxs("button", { type: "button", className: "agent-chat__activity-toggle", onClick: () => setOpen(!open), "aria-expanded": open, children: [open ? _jsx(ChatIcon, { name: "chevron-down", size: 14 }) : _jsx(ChatIcon, { name: "chevron-right", size: 14 }), _jsx(ChatIcon, { name: "thinking", size: 14 }), _jsx("span", { className: live ? "agent-chat__activity-live" : undefined, children: groupLabel(tools, live) })] }), open && _jsx("div", { className: "agent-chat__activity-details", children: parts.map((part, index) => part.type === "tool"
                    ? _jsx(ToolRow, { tool: part.tool, slots: slots }, part.tool.id)
                    : part.type === "reasoning" && _jsx("div", { className: "agent-chat__reasoning", children: slots?.renderMarkdown?.(part.text, Boolean(part.streaming)) ?? _jsx(AgentMarkdown, { streaming: part.streaming, children: part.text }) }, index)) })] });
}
function isActivityOnly(message) {
    if (!message.parts.length)
        return false;
    return message.parts.every((part) => part.type === "tool" || part.type === "reasoning");
}
function messageCommentary(message) {
    return message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
}
/** Default execution activity shared by page and panel consumers. */
export function ActivityFeed({ messages, live, slots }) {
    const blocks = [];
    let pending = [];
    let pendingKey = "";
    let pendingLive = false;
    const flush = () => {
        if (!pending.length)
            return;
        blocks.push({ key: `activity-${pendingKey}`, parts: pending, live: pendingLive });
        pending = [];
        pendingLive = false;
    };
    messages.forEach((message, index) => {
        const isLast = index === messages.length - 1;
        const commentary = messageCommentary(message);
        if (isActivityOnly(message) && !commentary) {
            if (!pending.length)
                pendingKey = message.id;
            pending.push(...message.parts);
            if (live && isLast)
                pendingLive = true;
            return;
        }
        flush();
        const activity = message.parts.filter((part) => part.type === "tool" || part.type === "reasoning");
        if (activity.length > 0)
            blocks.push({ key: `activity-${message.id}`, parts: activity, live: live && isLast });
        if (commentary)
            blocks.push({ key: `commentary-${message.id}`, commentary });
    });
    flush();
    return _jsx(_Fragment, { children: blocks.map((block) => "commentary" in block
            ? _jsx("div", { className: "agent-chat__activity-commentary", children: slots?.renderMarkdown?.(block.commentary, false) ?? _jsx(AgentMarkdown, { children: block.commentary }) }, block.key)
            : _jsx(ToolActivity, { parts: block.parts, slots: slots, live: block.live }, block.key)) });
}
//# sourceMappingURL=ToolActivity.js.map