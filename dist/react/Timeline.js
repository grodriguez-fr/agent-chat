import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Copy, RotateCcw } from "lucide-react";
import { buildThreadBlocks, formatDuration, messageText } from "../core/index.js";
import { AgentMarkdown } from "./Markdown.js";
import { ActivityFeed, ToolActivity } from "./ToolActivity.js";
function useElapsed(live, startedAt, fallback = null) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        if (!live)
            return;
        const timer = window.setInterval(() => setNow(Date.now()), 1_000);
        return () => window.clearInterval(timer);
    }, [live]);
    return live && startedAt != null ? Math.max(0, now - startedAt) : fallback;
}
function executionDuration(milliseconds) {
    const seconds = Math.max(0, Math.round(milliseconds / 1000));
    if (seconds < 60)
        return `${seconds} seconde${seconds === 1 ? "" : "s"}`;
    return formatDuration(milliseconds);
}
function partGroups(parts) {
    const groups = [];
    for (const part of parts) {
        const activity = part.type === "tool" || part.type === "reasoning";
        const last = groups.at(-1);
        if (activity && last?.every((entry) => entry.type === "tool" || entry.type === "reasoning"))
            last.push(part);
        else
            groups.push([part]);
    }
    return groups;
}
function MessageContent({ message, slots }) {
    return _jsx("div", { className: message.role === "user" ? "agent-chat__user-bubble" : "agent-chat__assistant-content", children: partGroups(message.parts).map((group, index) => {
            const part = group[0];
            if (part.type === "tool" || part.type === "reasoning")
                return _jsx(ToolActivity, { parts: group, slots: slots }, index);
            if (part.type === "text") {
                if (message.role === "user")
                    return _jsx("span", { children: part.text }, index);
                return _jsx("div", { children: slots?.renderMarkdown?.(part.text, Boolean(part.streaming)) ?? _jsx(AgentMarkdown, { streaming: part.streaming, children: part.text }) }, index);
            }
            if (part.type === "attachment")
                return _jsx("a", { className: "agent-chat__attachment", href: part.attachment.url, target: "_blank", rel: "noreferrer", children: part.attachment.name }, part.attachment.id);
            return _jsx("span", { children: slots?.renderMessageSlot?.(part.id, part.value) }, part.id);
        }) });
}
function MessageRow({ message, controller, slots }) {
    const text = messageText(message);
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setCopyError(false);
        }
        catch {
            setCopyError(true);
        }
    };
    return _jsxs("div", { className: `agent-chat__message agent-chat__message--${message.role}`, "data-agent-user-message": message.role === "user" ? "true" : undefined, children: [_jsx(MessageContent, { message: message, slots: slots }), slots?.renderMessageActions ? slots.renderMessageActions(message) : text && _jsxs("div", { className: "agent-chat__message-actions", children: [_jsx("button", { type: "button", onClick: () => void copy(), "aria-label": copied ? "Copié" : "Copier", children: _jsx(Copy, { size: 13 }) }), controller.retryMessage && _jsx("button", { type: "button", disabled: controller.status === "streaming", onClick: () => controller.retryMessage?.(message.sourceId ?? message.id), "aria-label": "R\u00E9essayer", children: _jsx(RotateCcw, { size: 13 }) }), copyError && _jsx("span", { role: "status", children: "Copie indisponible" })] })] });
}
function ExecutionGroup({ block, controller, slots }) {
    const [open, setOpen] = useState(block.live);
    const elapsed = useElapsed(block.live, controller.streamStartedAt, block.durationMs);
    useEffect(() => setOpen(block.live), [block.live]);
    const label = elapsed == null ? (block.live ? "Réflexion en cours…" : "Durée d’exécution : —") : block.live ? `Réflexion en cours depuis ${executionDuration(elapsed)}` : `Durée d’exécution : ${executionDuration(elapsed)}`;
    const hasActivity = block.messages.length > 0;
    return _jsxs("div", { className: "agent-chat__execution", children: [(hasActivity || block.live || elapsed != null) && (block.live
                ? _jsx("div", { className: "agent-chat__execution-header", role: "status", children: _jsx("span", { children: label }) })
                : _jsxs("button", { type: "button", className: "agent-chat__execution-header", disabled: !hasActivity, onClick: () => setOpen(!open), "aria-expanded": hasActivity ? open : undefined, children: [_jsx("span", { children: label }), hasActivity && (open ? _jsx(ChevronDown, { size: 14 }) : _jsx(ChevronRight, { size: 14 }))] })), open && hasActivity && _jsx("div", { className: "agent-chat__execution-body", children: slots?.renderActivity?.(block.messages, block.live) ?? _jsx(ActivityFeed, { messages: block.messages, live: block.live, slots: slots }) }), block.finalMessage && _jsx("div", { className: "agent-chat__final", children: _jsx(MessageRow, { message: block.finalMessage, controller: controller, slots: slots }) })] });
}
export function AgentTimeline({ controller, slots }) {
    const blocks = useMemo(() => buildThreadBlocks(controller.messages, controller.status === "streaming"), [controller.messages, controller.status]);
    return _jsxs("div", { className: "agent-chat__thread", children: [blocks.map((block) => block.type === "message" ? _jsx(MessageRow, { message: block.message, controller: controller, slots: slots }, block.message.id) : _jsx(ExecutionGroup, { block: block, controller: controller, slots: slots }, block.id)), slots?.afterMessages] });
}
//# sourceMappingURL=Timeline.js.map