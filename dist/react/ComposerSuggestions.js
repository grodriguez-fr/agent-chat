import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { applySuggestion, findTriggerMatch } from "../core/index.js";
/**
 * Trigger-based suggestions for the composer textarea. The caret is only
 * tracked while the textarea has focus, so suggestions never open in the
 * background.
 */
export function useComposerSuggestions(controller, textarea) {
    const listId = useId();
    const [caret, setCaret] = useState(null);
    const [dismissed, setDismissed] = useState(null);
    const [result, setResult] = useState(null);
    const [active, setActive] = useState(0);
    const sequence = useRef(0);
    const pendingCaret = useRef(null);
    const triggers = controller.triggers;
    const match = useMemo(() => caret == null || controller.disabled || !triggers ? null : findTriggerMatch(controller.input, caret, triggers), [caret, controller.disabled, controller.input, triggers]);
    const key = match ? `${match.start}:${match.trigger.char}:${match.query}` : null;
    const closed = !match || dismissed === match.start;
    useEffect(() => {
        if (!match || closed) {
            sequence.current += 1;
            setResult(null);
            return;
        }
        const current = ++sequence.current;
        const accept = (items) => {
            if (current !== sequence.current)
                return;
            setResult({ key: key, items });
            setActive(0);
        };
        try {
            const found = match.trigger.search(match.query);
            if (Array.isArray(found))
                accept(found);
            else
                found.then(accept, () => accept([]));
        }
        catch {
            accept([]);
        }
        // `key` identifies the match; its object identity changes on every render.
    }, [key, closed]);
    useEffect(() => { if (dismissed != null && match?.start !== dismissed)
        setDismissed(null); }, [match?.start, dismissed]);
    useLayoutEffect(() => {
        const node = textarea.current;
        if (pendingCaret.current == null || !node)
            return;
        node.focus();
        node.setSelectionRange(pendingCaret.current, pendingCaret.current);
        setCaret(pendingCaret.current);
        pendingCaret.current = null;
    }, [controller.input, textarea]);
    const items = !closed && result ? result.items : [];
    const emptyLabel = !closed && result?.key === key && !items.length ? match?.trigger.emptyLabel : undefined;
    const open = items.length > 0 || Boolean(emptyLabel);
    const activeIndex = Math.min(active, Math.max(0, items.length - 1));
    const optionId = (index) => `${listId}-option-${index}`;
    const select = (item) => {
        if (!match)
            return;
        const next = applySuggestion(controller.input, match, item.insert);
        pendingCaret.current = next.caret;
        controller.setInput(next.value);
    };
    const trackCaret = (node) => {
        setCaret(node.selectionStart === node.selectionEnd ? node.selectionStart : null);
    };
    /** Returns true when the key was consumed by the suggestion list. */
    const handleKeyDown = (event) => {
        if (!open || !match)
            return false;
        if (event.key === "Escape") {
            setDismissed(match.start);
            event.preventDefault();
            return true;
        }
        if (!items.length)
            return false;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            const step = event.key === "ArrowDown" ? 1 : -1;
            setActive((activeIndex + step + items.length) % items.length);
            event.preventDefault();
            return true;
        }
        if ((event.key === "Enter" && !event.shiftKey) || (event.key === "Tab" && !event.shiftKey)) {
            select(items[activeIndex]);
            event.preventDefault();
            return true;
        }
        return false;
    };
    const textareaProps = {
        "aria-autocomplete": triggers?.length ? "list" : undefined,
        "aria-controls": open ? listId : undefined,
        "aria-activedescendant": open && items.length ? optionId(activeIndex) : undefined,
        onSelect: (event) => trackCaret(event.currentTarget),
        onFocus: (event) => trackCaret(event.currentTarget),
        onBlur: () => setCaret(null),
    };
    const list = open ? _jsx(ComposerSuggestionList, { id: listId, label: match?.trigger.label ?? "Suggestions", items: items, activeIndex: activeIndex, emptyLabel: emptyLabel, optionId: optionId, onHover: setActive, onSelect: select }) : null;
    return { open, list, handleKeyDown, trackCaret, textareaProps };
}
export function ComposerSuggestionList({ id, label, items, activeIndex, emptyLabel, optionId, onHover, onSelect }) {
    const listRef = useRef(null);
    useEffect(() => {
        listRef.current?.querySelector(`[aria-selected="true"]`)?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);
    if (!items.length)
        return _jsx("div", { className: "agent-chat__suggest", id: id, role: "status", children: emptyLabel });
    return _jsx("ul", { ref: listRef, className: "agent-chat__suggest", id: id, role: "listbox", "aria-label": label, children: items.map((item, index) => _jsxs("li", { id: optionId(index), role: "option", "aria-selected": index === activeIndex, className: index === activeIndex ? "is-active" : undefined, 
            // Keep focus in the textarea so the caret and draft stay in place.
            onMouseDown: (event) => event.preventDefault(), onMouseEnter: () => onHover(index), onClick: () => onSelect(item), children: [item.icon && _jsx("span", { className: "agent-chat__suggest-icon", "aria-hidden": true, children: item.icon }), _jsxs("span", { className: "agent-chat__suggest-text", children: [_jsx("span", { children: item.label }), item.description && _jsx("small", { children: item.description })] })] }, item.id)) });
}
//# sourceMappingURL=ComposerSuggestions.js.map