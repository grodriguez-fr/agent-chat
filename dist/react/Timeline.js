import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, CircleAlert, Clock3, Copy, LoaderCircle, RotateCcw, Wrench } from "lucide-react";
import { buildThreadBlocks, formatDuration, messageText } from "../core/index.js";
import { AgentMarkdown } from "./Markdown.js";
function useElapsed(live, startedAt, fallback = 0) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        if (!live)
            return;
        const timer = window.setInterval(() => setNow(Date.now()), 1_000);
        return () => window.clearInterval(timer);
    }, [live]);
    return live && startedAt ? Math.max(0, now - startedAt) : fallback;
}
function ToolRow({ tool, slots }) {
    const [open, setOpen] = useState(tool.status === "running");
    const hasDetail = Boolean(tool.detail || tool.command || tool.output || tool.diffs?.length || slots?.renderToolDetail);
    const Icon = tool.status === "completed" ? Check : tool.status === "failed" ? CircleAlert : tool.status === "running" ? LoaderCircle : Wrench;
    return _jsxs("div", { className: `agent-chat__tool agent-chat__tool--${tool.status}`, children: [_jsxs("button", { type: "button", onClick: () => hasDetail && setOpen((value) => !value), "aria-expanded": hasDetail ? open : undefined, children: [hasDetail ? open ? _jsx(ChevronDown, { size: 14 }) : _jsx(ChevronRight, { size: 14 }) : _jsx("span", { className: "agent-chat__tool-spacer" }), _jsx(Icon, { size: 15, className: tool.status === "running" ? "is-spinning" : "" }), _jsx("span", { children: tool.title }), _jsx("small", { children: tool.status === "running" ? "en cours" : tool.status === "completed" ? "terminé" : tool.status === "failed" ? "échec" : tool.status })] }), open && hasDetail && _jsx("div", { className: "agent-chat__tool-detail", children: slots?.renderToolDetail?.(tool) ?? _jsxs(_Fragment, { children: [tool.detail && _jsx("p", { children: tool.detail }), tool.command && _jsx("pre", { children: _jsx("code", { children: tool.command }) }), tool.output && _jsx("pre", { children: _jsx("code", { children: tool.output }) }), tool.diffs?.map((diff) => _jsxs("div", { className: "agent-chat__diff", children: [_jsx("strong", { children: diff.path }), _jsxs("span", { children: ["+", diff.added ?? 0, " \u2212", diff.removed ?? 0] })] }, diff.path))] }) })] });
}
function MessageContent({ message, slots, finalOnly = false }) {
    const isUser = message.role === "user";
    return _jsx("div", { className: isUser ? "agent-chat__user-bubble" : "agent-chat__assistant-content", children: message.parts.map((part, index) => {
            if (part.type === "text")
                return slots?.renderMarkdown ? _jsx("div", { children: slots.renderMarkdown(part.text, Boolean(part.streaming)) }, index) : _jsx(AgentMarkdown, { streaming: part.streaming, children: part.text }, index);
            if (part.type === "reasoning")
                return finalOnly ? null : _jsxs("details", { className: "agent-chat__reasoning", open: part.streaming, children: [_jsx("summary", { children: "R\u00E9flexion" }), slots?.renderMarkdown ? slots.renderMarkdown(part.text, Boolean(part.streaming)) : _jsx(AgentMarkdown, { streaming: part.streaming, children: part.text })] }, index);
            if (part.type === "tool")
                return finalOnly ? null : _jsx(ToolRow, { tool: part.tool, slots: slots }, part.tool.id);
            if (part.type === "attachment")
                return _jsx("a", { className: "agent-chat__attachment", href: part.attachment.url, target: "_blank", rel: "noreferrer", children: part.attachment.name }, part.attachment.id);
            return _jsx("span", { children: slots?.renderMessageSlot?.(part.id, part.value) }, part.id);
        }) });
}
function MessageRow({ message, controller, slots, finalOnly = false }) {
    const text = messageText(message);
    return _jsxs("div", { className: `agent-chat__message agent-chat__message--${message.role}`, "data-agent-user-message": message.role === "user" ? "true" : undefined, children: [_jsx(MessageContent, { message: message, slots: slots, finalOnly: finalOnly }), slots?.renderMessageActions
                ? slots.renderMessageActions(message)
                : text && _jsxs("div", { className: "agent-chat__message-actions", children: [_jsx("button", { type: "button", onClick: () => void navigator.clipboard?.writeText(text), "aria-label": "Copier", children: _jsx(Copy, { size: 13 }) }), controller.retryMessage && _jsx("button", { type: "button", onClick: () => controller.retryMessage?.(message.id), "aria-label": "R\u00E9essayer", children: _jsx(RotateCcw, { size: 13 }) })] })] });
}
function ExecutionGroup({ block, controller, slots }) {
    const [open, setOpen] = useState(block.live);
    const elapsed = useElapsed(block.live, controller.streamStartedAt, block.durationMs ?? 0);
    useEffect(() => setOpen(block.live), [block.live]);
    const label = block.live ? `En cours depuis ${formatDuration(elapsed)}` : `Durée d’exécution : ${formatDuration(elapsed)}`;
    return _jsxs("div", { className: "agent-chat__execution", children: [block.live ? _jsxs("div", { className: "agent-chat__execution-header", role: "status", children: [_jsx(Clock3, { size: 14 }), _jsx("span", { children: label })] }) : _jsxs("button", { type: "button", className: "agent-chat__execution-header", onClick: () => setOpen((value) => !value), "aria-expanded": open, children: [open ? _jsx(ChevronDown, { size: 14 }) : _jsx(ChevronRight, { size: 14 }), _jsx("span", { children: label })] }), open && _jsx("div", { className: "agent-chat__execution-body", children: block.messages.map((message) => _jsx(MessageRow, { message: message, controller: controller, slots: slots }, message.id)) }), block.finalMessage && _jsx("div", { className: "agent-chat__final", children: _jsx(MessageRow, { message: block.finalMessage, controller: controller, slots: slots, finalOnly: true }) })] });
}
export function AgentTimeline({ controller, slots }) {
    const blocks = useMemo(() => buildThreadBlocks(controller.messages, controller.status === "streaming"), [controller.messages, controller.status]);
    return _jsxs("div", { className: "agent-chat__thread", children: [blocks.map((block) => block.type === "message" ? _jsx(MessageRow, { message: block.message, controller: controller, slots: slots }, block.message.id) : _jsx(ExecutionGroup, { block: block, controller: controller, slots: slots }, block.id)), slots?.afterMessages] });
}
//# sourceMappingURL=Timeline.js.map