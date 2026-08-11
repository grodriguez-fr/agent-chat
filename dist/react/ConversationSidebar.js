import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Check, Pencil, Pin, PinOff, Plus, Search, Trash2, X } from "lucide-react";
import { groupConversations } from "../core/index.js";
export function ConversationSidebar({ controller, brandName, onNavigate }) {
    const [query, setQuery] = useState("");
    const [editing, setEditing] = useState(null);
    const [title, setTitle] = useState("");
    const conversations = controller.conversations ?? [];
    const filtered = useMemo(() => {
        const needle = query.trim().toLocaleLowerCase();
        return needle ? conversations.filter((item) => item.title.toLocaleLowerCase().includes(needle)) : conversations;
    }, [conversations, query]);
    const groups = useMemo(() => groupConversations(filtered), [filtered]);
    const save = (id) => {
        if (title.trim())
            controller.renameConversation?.(id, title.trim());
        setEditing(null);
    };
    return (_jsxs("div", { className: "agent-chat__sidebar-content", children: [_jsxs("div", { className: "agent-chat__sidebar-brand", children: [_jsx("span", { className: "agent-chat__brand-mark", "aria-hidden": true, children: brandName.slice(0, 1) }), _jsx("strong", { children: brandName })] }), _jsxs("div", { className: "agent-chat__sidebar-actions", children: [controller.newConversation && _jsxs("button", { type: "button", onClick: () => { controller.newConversation?.(); onNavigate?.(); }, children: [_jsx(Plus, { size: 16 }), "Nouvelle conversation"] }), _jsxs("label", { className: "agent-chat__search", children: [_jsx(Search, { size: 15 }), _jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Rechercher\u2026", "aria-label": "Rechercher une conversation" }), query && _jsx("button", { type: "button", onClick: () => setQuery(""), "aria-label": "Effacer", children: _jsx(X, { size: 13 }) })] })] }), _jsxs("div", { className: "agent-chat__conversation-scroll", children: [groups.map((group) => (_jsxs("section", { className: "agent-chat__conversation-group", "aria-label": group.label, children: [_jsx("p", { children: group.label }), group.items.map((conversation) => (_jsxs("div", { className: `agent-chat__conversation${controller.activeConversationId === conversation.id ? " is-active" : ""}`, children: [editing === conversation.id ? _jsxs(_Fragment, { children: [_jsx("input", { autoFocus: true, value: title, onChange: (event) => setTitle(event.target.value), onKeyDown: (event) => { if (event.key === "Enter")
                                                    save(conversation.id); if (event.key === "Escape")
                                                    setEditing(null); } }), _jsx("button", { type: "button", onClick: () => save(conversation.id), "aria-label": "Enregistrer", children: _jsx(Check, { size: 13 }) })] }) : _jsx("button", { type: "button", className: "agent-chat__conversation-title", title: conversation.title, onClick: () => { controller.selectConversation?.(conversation.id); onNavigate?.(); }, children: conversation.title }), conversation.busy && _jsx("span", { className: `agent-chat__busy agent-chat__busy--${conversation.busy}`, title: "Conversation en cours" }), _jsxs("div", { className: "agent-chat__conversation-actions", children: [controller.pinConversation && _jsx("button", { type: "button", onClick: () => controller.pinConversation?.(conversation.id, !conversation.pinned), "aria-label": conversation.pinned ? "Désépingler" : "Épingler", children: conversation.pinned ? _jsx(PinOff, { size: 13 }) : _jsx(Pin, { size: 13 }) }), controller.renameConversation && _jsx("button", { type: "button", onClick: () => { setEditing(conversation.id); setTitle(conversation.title); }, "aria-label": "Renommer", children: _jsx(Pencil, { size: 13 }) }), controller.deleteConversation && _jsx("button", { type: "button", onClick: () => controller.deleteConversation?.(conversation.id), "aria-label": "Supprimer", children: _jsx(Trash2, { size: 13 }) })] })] }, conversation.id)))] }, group.label))), conversations.length === 0 && _jsx("p", { className: "agent-chat__empty-list", children: "Aucune conversation." }), conversations.length > 0 && filtered.length === 0 && _jsx("p", { className: "agent-chat__empty-list", children: "Aucun r\u00E9sultat." })] })] }));
}
//# sourceMappingURL=ConversationSidebar.js.map