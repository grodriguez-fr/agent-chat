import { type KeyboardEventHandler } from "react";
import type { AgentChatController, AgentChatSlots } from "../core/index.js";
export type AgentChatShellProps = {
    variant: "page" | "panel";
    controller: AgentChatController;
    brandName: string;
    slots?: AgentChatSlots;
    suggestions?: string[];
    emptyTitle?: string;
    emptyDescription?: string;
    placeholder?: string;
    className?: string;
    open?: boolean;
    onClose?: () => void;
    onExpand?: () => void;
    panelWidth?: string;
    /** Runs before Enter sends; call preventDefault() to keep the default from running. */
    onComposerKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
    /** Header title when the active conversation has no title; defaults to `brandName`. */
    fallbackTitle?: string;
    /** Show the brand row at the top of the conversation column; defaults to true. */
    showSidebarBrand?: boolean;
    /** Hide the header "Nouvelle conversation" button on desktop when the conversation column shows its own. */
    dedupeNewConversation?: boolean;
};
export declare function AgentChatShell({ variant, controller, brandName, slots, suggestions, emptyTitle, emptyDescription, placeholder, className, open, onClose, onExpand, panelWidth, onComposerKeyDown, fallbackTitle, showSidebarBrand, dedupeNewConversation }: AgentChatShellProps): import("react").JSX.Element | null;
//# sourceMappingURL=AgentChatShell.d.ts.map