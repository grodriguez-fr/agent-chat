import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { ArrowUp, Check, Clock3, Pencil, X } from "lucide-react";
export function ComposerQueue({ controller }) {
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState("");
    const save = (id) => {
        if (!draft.trim())
            return;
        controller.editQueued?.(id, draft.trim());
        setEditing(null);
    };
    if (!controller.queue?.length)
        return null;
    return _jsx("div", { className: "agent-chat__queue", children: controller.queue.map((item) => _jsxs("div", { className: "agent-chat__queue-row", children: [_jsx(Clock3, { size: 13 }), editing === item.id ? _jsx("input", { autoFocus: true, "aria-label": "Modifier le message en attente", value: draft, onChange: (event) => setDraft(event.target.value), onKeyDown: (event) => {
                        if (event.nativeEvent.isComposing)
                            return;
                        if (event.key === "Enter") {
                            event.preventDefault();
                            save(item.id);
                        }
                        if (event.key === "Escape")
                            setEditing(null);
                    } }) : _jsx("span", { title: item.text, children: item.text }), _jsxs("div", { children: [controller.editQueued && _jsx("button", { type: "button", onClick: () => {
                                if (editing === item.id)
                                    save(item.id);
                                else {
                                    setEditing(item.id);
                                    setDraft(item.text);
                                }
                            }, "aria-label": editing === item.id ? "Enregistrer" : "Modifier", children: editing === item.id ? _jsx(Check, { size: 13 }) : _jsx(Pencil, { size: 13 }) }), controller.sendQueued && _jsx("button", { type: "button", onClick: () => controller.sendQueued?.(item.id), "aria-label": "Envoyer maintenant", children: _jsx(ArrowUp, { size: 13 }) }), controller.cancelQueued && _jsx("button", { type: "button", onClick: () => controller.cancelQueued?.(item.id), "aria-label": "Retirer", children: _jsx(X, { size: 13 }) })] })] }, item.id)) });
}
//# sourceMappingURL=ComposerQueue.js.map