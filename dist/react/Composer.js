import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Mic, Paperclip, Pencil, Square, X } from "lucide-react";
export function AgentComposer({ controller, slots, placeholder = "Demande à l’agent…" }) {
    const textarea = useRef(null);
    const fileInput = useRef(null);
    const recognition = useRef(null);
    const [listening, setListening] = useState(false);
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState("");
    const canSend = Boolean(controller.input.trim()) && !controller.disabled;
    useEffect(() => {
        if (!textarea.current)
            return;
        textarea.current.style.height = "auto";
        textarea.current.style.height = `${Math.min(textarea.current.scrollHeight, 160)}px`;
    }, [controller.input]);
    const send = () => {
        const value = controller.input.trim();
        if (!value || controller.disabled)
            return;
        controller.send(value);
        controller.setInput("");
    };
    const toggleVoice = () => {
        const scope = window;
        const Ctor = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
        if (!Ctor)
            return;
        if (listening) {
            recognition.current?.stop();
            return;
        }
        const instance = new Ctor();
        recognition.current = instance;
        instance.lang = "fr-FR";
        instance.continuous = false;
        instance.interimResults = false;
        instance.onresult = (event) => controller.setInput(`${controller.input}${controller.input ? " " : ""}${event.results[0]?.[0]?.transcript ?? ""}`);
        instance.onend = () => setListening(false);
        setListening(true);
        instance.start();
    };
    return (_jsxs("div", { className: "agent-chat__composer-wrap", children: [(controller.queue?.length ?? 0) > 0 && _jsx("div", { className: "agent-chat__queue", children: controller.queue?.map((item) => _jsxs("div", { className: "agent-chat__queue-row", children: [editing === item.id ? _jsx("input", { autoFocus: true, value: draft, onChange: (event) => setDraft(event.target.value), onKeyDown: (event) => { if (event.key === "Enter" && draft.trim()) {
                                controller.editQueued?.(item.id, draft.trim());
                                setEditing(null);
                            } } }) : _jsx("span", { title: item.text, children: item.text }), _jsxs("div", { children: [controller.editQueued && _jsx("button", { type: "button", onClick: () => { if (editing === item.id && draft.trim()) {
                                        controller.editQueued?.(item.id, draft.trim());
                                        setEditing(null);
                                    }
                                    else {
                                        setEditing(item.id);
                                        setDraft(item.text);
                                    } }, "aria-label": "Modifier", children: editing === item.id ? _jsx(Check, { size: 13 }) : _jsx(Pencil, { size: 13 }) }), controller.sendQueued && _jsx("button", { type: "button", onClick: () => controller.sendQueued?.(item.id), "aria-label": "Envoyer maintenant", children: _jsx(ArrowUp, { size: 13 }) }), controller.cancelQueued && _jsx("button", { type: "button", onClick: () => controller.cancelQueued?.(item.id), "aria-label": "Retirer", children: _jsx(X, { size: 13 }) })] })] }, item.id)) }), _jsxs("div", { className: "agent-chat__composer", children: [_jsx("textarea", { ref: textarea, value: controller.input, onChange: (event) => controller.setInput(event.target.value), placeholder: controller.disabled ? controller.disabledReason : placeholder, disabled: controller.disabled, rows: 1, onKeyDown: (event) => { if (event.nativeEvent.isComposing)
                            return; if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            send();
                        } } }), _jsxs("div", { className: "agent-chat__composer-toolbar", children: [_jsxs("div", { className: "agent-chat__composer-leading", children: [slots?.composerLeading, controller.models && controller.setModel && _jsx("select", { value: controller.selectedModel, onChange: (event) => controller.setModel?.(event.target.value), "aria-label": "Mod\u00E8le", children: controller.models.map((option) => _jsx("option", { value: option.id, children: option.label }, option.id)) }), controller.efforts && controller.setEffort && _jsx("select", { value: controller.selectedEffort, onChange: (event) => controller.setEffort?.(event.target.value), "aria-label": "Effort", children: controller.efforts.map((option) => _jsx("option", { value: option.id, children: option.label }, option.id)) })] }), _jsxs("div", { className: "agent-chat__composer-trailing", children: [slots?.composerTrailing, controller.attach && _jsxs(_Fragment, { children: [_jsx("input", { ref: fileInput, hidden: true, type: "file", multiple: true, onChange: (event) => { controller.attach?.(Array.from(event.target.files ?? [])); event.target.value = ""; } }), _jsx("button", { type: "button", onClick: () => fileInput.current?.click(), "aria-label": "Joindre", children: _jsx(Paperclip, { size: 17 }) })] }), _jsx("button", { type: "button", onClick: toggleVoice, className: listening ? "is-active" : "", "aria-label": listening ? "Arrêter la dictée" : "Dicter", children: _jsx(Mic, { size: 17 }) }), controller.status === "streaming" && controller.stop && _jsx("button", { type: "button", className: "agent-chat__stop", onClick: controller.stop, "aria-label": "Arr\u00EAter", children: _jsx(Square, { size: 13, fill: "currentColor" }) }), _jsx("button", { type: "button", className: "agent-chat__send", onClick: send, disabled: !canSend, "aria-label": controller.status === "streaming" ? "Mettre en file" : "Envoyer", children: _jsx(ArrowUp, { size: 17 }) })] })] })] })] }));
}
//# sourceMappingURL=Composer.js.map