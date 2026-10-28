import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { ChatIcon } from "./icons.js";
/** Messages waiting for the end of the turn, in a tray attached above the composer. */
export function ComposerQueue({ controller }) {
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState("");
    const save = (id) => {
        if (!draft.trim())
            return;
        controller.editQueued?.(id, draft.trim());
        setEditing(null);
    };
    const queue = controller.queue ?? [];
    if (!queue.length)
        return null;
    const label = queue.length === 1 ? "1 message en attente" : `${queue.length} messages en attente`;
    return _jsx("section", { className: "agent-chat__queue", "aria-label": label, children: _jsx("ol", { className: "agent-chat__queue-list", children: queue.map((item) => _jsxs("li", { className: "agent-chat__queue-row", "data-editing": editing === item.id || undefined, children: [_jsx(ChatIcon, { name: "queued", size: 14 }), editing === item.id ? _jsx("input", { autoFocus: true, "aria-label": "Modifier le message en attente", value: draft, onChange: (event) => setDraft(event.target.value), onKeyDown: (event) => {
                            if (event.nativeEvent.isComposing)
                                return;
                            if (event.key === "Enter") {
                                event.preventDefault();
                                save(item.id);
                            }
                            if (event.key === "Escape")
                                setEditing(null);
                        } }) : _jsx("span", { className: "agent-chat__queue-text", title: item.text, children: item.text }), _jsxs("div", { className: "agent-chat__queue-actions", children: [controller.editQueued && _jsx("button", { type: "button", onClick: () => {
                                    if (editing === item.id)
                                        save(item.id);
                                    else {
                                        setEditing(item.id);
                                        setDraft(item.text);
                                    }
                                }, "aria-label": editing === item.id ? "Enregistrer" : "Modifier", title: editing === item.id ? "Enregistrer" : "Modifier", children: editing === item.id ? _jsx(ChatIcon, { name: "check", size: 14 }) : _jsx(ChatIcon, { name: "edit", size: 14 }) }), controller.sendQueued && editing !== item.id && _jsx("button", { type: "button", className: "agent-chat__queue-send", onClick: () => controller.sendQueued?.(item.id), "aria-label": "Envoyer maintenant", title: "Envoyer maintenant", children: _jsx(ChatIcon, { name: "arrow-up", size: 14 }) }), controller.cancelQueued && _jsx("button", { type: "button", onClick: () => controller.cancelQueued?.(item.id), "aria-label": "Retirer", title: "Retirer de la file", children: _jsx(ChatIcon, { name: "close", size: 14 }) })] })] }, item.id)) }) });
}
//# sourceMappingURL=ComposerQueue.js.map