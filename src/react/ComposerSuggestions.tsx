import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { applySuggestion, findTriggerMatch, type AgentChatController, type ComposerSuggestion } from "../core/index.js";

type SearchResult = { key: string; items: ComposerSuggestion[] };

/**
 * Trigger-based suggestions for the composer textarea. The caret is only
 * tracked while the textarea has focus, so suggestions never open in the
 * background.
 */
export function useComposerSuggestions(controller: AgentChatController, textarea: RefObject<HTMLTextAreaElement | null>) {
  const listId = useId();
  const [caret, setCaret] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<number | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [active, setActive] = useState(0);
  const sequence = useRef(0);
  const pendingCaret = useRef<number | null>(null);
  const triggers = controller.triggers;
  const match = useMemo(
    () => caret == null || controller.disabled || !triggers ? null : findTriggerMatch(controller.input, caret, triggers),
    [caret, controller.disabled, controller.input, triggers],
  );
  const key = match ? `${match.start}:${match.trigger.char}:${match.query}` : null;
  const closed = !match || dismissed === match.start;

  useEffect(() => {
    if (!match || closed) { sequence.current += 1; setResult(null); return; }
    const current = ++sequence.current;
    const accept = (items: ComposerSuggestion[]) => {
      if (current !== sequence.current) return;
      setResult({ key: key!, items });
      setActive(0);
    };
    try {
      const found = match.trigger.search(match.query);
      if (Array.isArray(found)) accept(found);
      else found.then(accept, () => accept([]));
    } catch { accept([]); }
    // `key` identifies the match; its object identity changes on every render.
  }, [key, closed]);

  useEffect(() => { if (dismissed != null && match?.start !== dismissed) setDismissed(null); }, [match?.start, dismissed]);

  useLayoutEffect(() => {
    const node = textarea.current;
    if (pendingCaret.current == null || !node) return;
    node.focus();
    node.setSelectionRange(pendingCaret.current, pendingCaret.current);
    setCaret(pendingCaret.current);
    pendingCaret.current = null;
  }, [controller.input, textarea]);

  const items = !closed && result ? result.items : [];
  const emptyLabel = !closed && result?.key === key && !items.length ? match?.trigger.emptyLabel : undefined;
  const open = items.length > 0 || Boolean(emptyLabel);
  const activeIndex = Math.min(active, Math.max(0, items.length - 1));
  const optionId = (index: number) => `${listId}-option-${index}`;

  const select = (item: ComposerSuggestion) => {
    if (!match) return;
    const next = applySuggestion(controller.input, match, item.insert);
    pendingCaret.current = next.caret;
    controller.setInput(next.value);
  };

  const trackCaret = (node: HTMLTextAreaElement) => {
    setCaret(node.selectionStart === node.selectionEnd ? node.selectionStart : null);
  };

  /** Returns true when the key was consumed by the suggestion list. */
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open || !match) return false;
    if (event.key === "Escape") {
      setDismissed(match.start);
      event.preventDefault();
      return true;
    }
    if (!items.length) return false;
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
    "aria-autocomplete": triggers?.length ? "list" as const : undefined,
    "aria-controls": open ? listId : undefined,
    "aria-activedescendant": open && items.length ? optionId(activeIndex) : undefined,
    onSelect: (event: { currentTarget: HTMLTextAreaElement }) => trackCaret(event.currentTarget),
    onFocus: (event: { currentTarget: HTMLTextAreaElement }) => trackCaret(event.currentTarget),
    onBlur: () => setCaret(null),
  };

  const list = open ? <ComposerSuggestionList id={listId} label={match?.trigger.label ?? "Suggestions"} items={items} activeIndex={activeIndex} emptyLabel={emptyLabel} optionId={optionId} onHover={setActive} onSelect={select} /> : null;

  return { open, list, handleKeyDown, trackCaret, textareaProps };
}

type ListProps = {
  id: string;
  label: string;
  items: ComposerSuggestion[];
  activeIndex: number;
  emptyLabel?: string;
  optionId: (index: number) => string;
  onHover: (index: number) => void;
  onSelect: (item: ComposerSuggestion) => void;
};

export function ComposerSuggestionList({ id, label, items, activeIndex, emptyLabel, optionId, onHover, onSelect }: ListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[aria-selected="true"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);
  if (!items.length) return <div className="agent-chat__suggest" id={id} role="status">{emptyLabel}</div>;
  return <ul ref={listRef} className="agent-chat__suggest" id={id} role="listbox" aria-label={label}>
    {items.map((item, index) => <li
      key={item.id}
      id={optionId(index)}
      role="option"
      aria-selected={index === activeIndex}
      className={index === activeIndex ? "is-active" : undefined}
      // Keep focus in the textarea so the caret and draft stay in place.
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={() => onHover(index)}
      onClick={() => onSelect(item)}
    >
      {item.icon && <span className="agent-chat__suggest-icon" aria-hidden>{item.icon}</span>}
      <span className="agent-chat__suggest-text"><span>{item.label}</span>{item.description && <small>{item.description}</small>}</span>
    </li>)}
  </ul>;
}
