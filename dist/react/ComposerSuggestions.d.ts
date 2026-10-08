import { type KeyboardEvent, type RefObject } from "react";
import { type AgentChatController, type ComposerSuggestion } from "../core/index.js";
/**
 * Trigger-based suggestions for the composer textarea. The caret is only
 * tracked while the textarea has focus, so suggestions never open in the
 * background.
 */
export declare function useComposerSuggestions(controller: AgentChatController, textarea: RefObject<HTMLTextAreaElement | null>): {
    open: boolean;
    list: import("react").JSX.Element | null;
    handleKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => boolean;
    trackCaret: (node: HTMLTextAreaElement) => void;
    textareaProps: {
        "aria-autocomplete": "list" | undefined;
        "aria-controls": string | undefined;
        "aria-activedescendant": string | undefined;
        onSelect: (event: {
            currentTarget: HTMLTextAreaElement;
        }) => void;
        onFocus: (event: {
            currentTarget: HTMLTextAreaElement;
        }) => void;
        onBlur: () => void;
    };
};
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
export declare function ComposerSuggestionList({ id, label, items, activeIndex, emptyLabel, optionId, onHover, onSelect }: ListProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ComposerSuggestions.d.ts.map