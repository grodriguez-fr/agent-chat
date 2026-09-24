import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
function shortLabel(option) {
    return option.shortLabel
        ?? option.label.replace(/^opencode\s+zen\s*\/\s*/i, "").replace(/^opencode\s*\/\s*/i, "").replace(/^openrouter\s*\/\s*/i, "");
}
function providerMark(option) {
    const value = (option.provider ?? "") + " " + option.id + " " + option.label;
    const normalized = value.toLowerCase();
    if (normalized.includes("opencode"))
        return "OC";
    if (normalized.includes("openrouter"))
        return "OR";
    if (normalized.includes("grok"))
        return "G";
    if (normalized.includes("claude") || normalized.includes("anthropic"))
        return "C";
    if (normalized.includes("codex"))
        return "✳";
    if (normalized.includes("google") || normalized.includes("antigravity"))
        return "G";
    return "AI";
}
function ProviderMark({ option }) {
    return _jsx("i", { className: "agent-chat__provider-mark", "aria-hidden": "true", children: providerMark(option) });
}
export function ComposerSettingsPicker({ models, selectedModel, setModel, efforts, selectedEffort, setEffort, disabled, menuSide }) {
    const [open, setOpen] = useState(false);
    const [panelView, setPanelView] = useState("settings");
    const [popoverStyle, setPopoverStyle] = useState();
    const rootRef = useRef(null);
    const currentModel = models.find((option) => option.id === selectedModel) ?? models[0];
    const currentEffort = efforts.find((option) => option.id === selectedEffort) ?? efforts[0];
    const effortIndex = Math.max(0, efforts.findIndex((option) => option.id === currentEffort?.id));
    const effortProgress = efforts.length > 1 ? (effortIndex / (efforts.length - 1)) * 100 : 100;
    useEffect(() => {
        if (!open)
            return;
        const onPointerDown = (event) => {
            if (!rootRef.current?.contains(event.target))
                setOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === "Escape")
                setOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);
    useLayoutEffect(() => {
        if (!open) {
            setPopoverStyle(undefined);
            return;
        }
        const updatePosition = () => {
            const root = rootRef.current;
            const trigger = root?.querySelector(".agent-chat__settings-trigger");
            if (!root || !trigger)
                return;
            const triggerRect = trigger.getBoundingClientRect();
            let clipLeft = 12;
            let clipRight = window.innerWidth - 12;
            let ancestor = root.parentElement;
            while (ancestor) {
                const style = getComputedStyle(ancestor);
                if (style.overflowX !== "visible") {
                    const rect = ancestor.getBoundingClientRect();
                    clipLeft = Math.max(clipLeft, rect.left);
                    clipRight = Math.min(clipRight, rect.right);
                }
                ancestor = ancestor.parentElement;
            }
            const width = Math.min(336, Math.max(220, clipRight - clipLeft - 24));
            const left = Math.min(Math.max(triggerRect.right - width, clipLeft + 12), clipRight - width - 12);
            const vertical = menuSide === "up"
                ? { bottom: window.innerHeight - triggerRect.top + 8 }
                : { top: triggerRect.bottom + 8 };
            setPopoverStyle({ position: "fixed", left, width, ...vertical });
        };
        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [open, menuSide, panelView]);
    if (!currentModel || !currentEffort)
        return null;
    const toggle = () => { setOpen((value) => !value); setPanelView("settings"); };
    const popoverClass = ["agent-chat__settings-popover", menuSide === "up" ? "is-up" : "is-down"].join(" ");
    return _jsxs("div", { ref: rootRef, className: "agent-chat__settings-picker", children: [_jsxs("button", { type: "button", disabled: disabled, "aria-haspopup": "dialog", "aria-expanded": open, "aria-label": "Choisir le mod\u00E8le et le niveau d'effort", onClick: toggle, className: "agent-chat__settings-trigger", children: [_jsx(ProviderMark, { option: currentModel }), _jsx("span", { className: "agent-chat__settings-model", children: shortLabel(currentModel) }), _jsx("span", { "aria-hidden": "true", className: "agent-chat__settings-separator", children: "\u00B7" }), _jsx("span", { className: "agent-chat__settings-effort", children: currentEffort.label }), _jsx(ChevronDown, { size: 16, className: "agent-chat__settings-chevron" })] }), open && _jsx("div", { role: "dialog", "aria-label": "R\u00E9glages du mod\u00E8le et du raisonnement", className: popoverClass + (popoverStyle ? " is-positioned" : ""), style: popoverStyle, children: panelView === "models" ? _jsxs("div", { className: "agent-chat__settings-models", role: "listbox", "aria-label": "S\u00E9lectionner un mod\u00E8le", children: [_jsxs("button", { type: "button", onClick: () => setPanelView("settings"), className: "agent-chat__settings-back", children: [_jsx(ChevronLeft, { size: 16 }), _jsx("span", { children: "Mod\u00E8les" })] }), models.map((option) => _jsxs("button", { type: "button", role: "option", "aria-selected": option.id === selectedModel, onClick: () => { setModel(option.id); setOpen(false); }, className: "agent-chat__settings-option" + (option.id === selectedModel ? " is-selected" : ""), children: [_jsx(ProviderMark, { option: option }), _jsx("span", { className: "agent-chat__settings-option-copy", children: _jsx("strong", { children: shortLabel(option) }) }), option.id === selectedModel && _jsx(Check, { size: 16 })] }, option.id))] }) : _jsxs("div", { className: "agent-chat__settings-view", children: [_jsxs("button", { type: "button", onClick: () => setPanelView("models"), className: "agent-chat__settings-model-row", children: [_jsx("span", { children: _jsxs("strong", { children: [_jsx(ProviderMark, { option: currentModel }), shortLabel(currentModel)] }) }), _jsx(ChevronRight, { size: 16 })] }), _jsxs("div", { className: "agent-chat__settings-effort-panel", children: [_jsxs("div", { className: "agent-chat__settings-effort-heading", children: [_jsxs("span", { children: [_jsx("strong", { children: currentEffort.label }), _jsx(ChevronRight, { size: 13 })] }), _jsx("button", { type: "button", "aria-label": "R\u00E9initialiser l'effort", onClick: () => setEffort(efforts[Math.floor((efforts.length - 1) / 2)]?.id ?? currentEffort.id), children: _jsx(RotateCcw, { size: 14 }) })] }), _jsx("div", { className: "agent-chat__settings-effort-model", children: shortLabel(currentModel) }), _jsx("input", { "aria-label": "Niveau d'effort", type: "range", min: "0", max: efforts.length - 1, step: "1", value: effortIndex, onChange: (event) => setEffort(efforts[Number(event.currentTarget.value)]?.id ?? currentEffort.id), style: { background: "linear-gradient(to right, var(--agent-accent) " + effortProgress + "%, color-mix(in srgb, var(--agent-text) 16%, transparent) " + effortProgress + "%)" } })] })] }) })] });
}
//# sourceMappingURL=ComposerSettingsPicker.js.map