import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, LoaderCircle, Mic, Paperclip, Square } from "lucide-react";
import { ComposerQueue } from "./ComposerQueue.js";
import { useDictation } from "./useDictation.js";
import { ComposerSettingsPicker } from "./ComposerSettingsPicker.js";
export function AgentComposer({ controller, slots, placeholder = "Demande à l’agent…", settingsMenuSide = "up", onKeyDown }) {
    const textarea = useRef(null);
    const fileInput = useRef(null);
    const pending = useRef(false);
    const latestInput = useRef(controller.input);
    latestInput.current = controller.input;
    const [submitting, setSubmitting] = useState(false);
    const [sendError, setSendError] = useState(null);
    const voice = useDictation(controller.input, controller.setInput);
    const busy = controller.status === "streaming" || controller.status === "connecting";
    const canSend = (Boolean(controller.input.trim()) || controller.hasAttachments) && !controller.disabled && !controller.sendingDisabled && !submitting && (!busy || controller.allowQueue);
    useEffect(() => {
        const node = textarea.current;
        if (!node)
            return;
        node.style.height = "auto";
        node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
    }, [controller.input]);
    const send = async () => {
        if (!canSend || pending.current)
            return;
        const draft = controller.input;
        pending.current = true;
        setSubmitting(true);
        setSendError(null);
        try {
            const accepted = await controller.send(draft.trim());
            if (accepted !== false && latestInput.current === draft)
                controller.setInput("");
        }
        catch {
            setSendError("Message non envoyé. Ton brouillon est conservé.");
        }
        finally {
            pending.current = false;
            setSubmitting(false);
        }
    };
    return _jsxs("div", { className: "agent-chat__composer-wrap", children: [_jsxs("div", { className: "agent-chat__composer", "data-disabled": controller.disabled || undefined, children: [_jsx(ComposerQueue, { controller: controller }), slots?.composerBefore, _jsx("textarea", { ref: textarea, "aria-label": "Message \u00E0 l\u2019agent", value: controller.input, onChange: (event) => controller.setInput(event.target.value), placeholder: controller.disabled ? controller.disabledReason ?? placeholder : placeholder, disabled: controller.disabled, rows: 1, onKeyDown: (event) => {
                            if (event.nativeEvent.isComposing)
                                return;
                            onKeyDown?.(event);
                            if (!event.defaultPrevented && event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                void send();
                            }
                        } }), _jsxs("div", { className: "agent-chat__composer-toolbar", children: [_jsxs("div", { className: "agent-chat__composer-leading", children: [slots?.composerLeading, controller.attach && _jsxs(_Fragment, { children: [_jsx("input", { ref: fileInput, hidden: true, type: "file", multiple: true, onChange: (event) => { controller.attach?.(Array.from(event.target.files ?? [])); event.target.value = ""; } }), _jsx("button", { type: "button", disabled: controller.disabled || controller.sendingDisabled, onClick: () => fileInput.current?.click(), "aria-label": "Joindre", children: _jsx(Paperclip, { size: 15 }) })] }), controller.models && controller.setModel && controller.efforts && controller.setEffort && _jsx(ComposerSettingsPicker, { models: controller.models, selectedModel: controller.selectedModel, setModel: controller.setModel, efforts: controller.efforts, selectedEffort: controller.selectedEffort, setEffort: controller.setEffort, disabled: Boolean(controller.disabled), menuSide: settingsMenuSide })] }), _jsxs("div", { className: "agent-chat__composer-trailing", children: [slots?.composerTrailing, slots?.voiceControl !== undefined ? slots.voiceControl : voice.supported && _jsx("button", { type: "button", disabled: controller.disabled, onClick: voice.toggle, className: voice.listening ? "is-active" : "", "aria-pressed": voice.listening, "aria-label": voice.listening ? "Arrêter la dictée" : "Dicter un message", children: _jsx(Mic, { size: 15 }) }), controller.status === "streaming" && controller.stop && _jsx("button", { type: "button", className: "agent-chat__stop", onClick: controller.stop, "aria-label": "Interrompre la r\u00E9ponse", children: _jsx(Square, { size: 13, fill: "currentColor" }) }), _jsx("button", { type: "button", className: "agent-chat__send", onClick: () => void send(), disabled: !canSend, "aria-busy": submitting || controller.status === "connecting", "aria-label": controller.status === "streaming" && controller.allowQueue ? "Mettre en file" : "Envoyer", children: submitting || controller.status === "connecting" ? _jsx(LoaderCircle, { size: 16, className: "is-spinning" }) : _jsx(ArrowUp, { size: 16, strokeWidth: 2.5 }) })] })] })] }), (sendError || voice.error) && _jsx("p", { className: "agent-chat__composer-error", role: "alert", children: sendError || voice.error })] });
}
//# sourceMappingURL=Composer.js.map