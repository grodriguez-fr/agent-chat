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
};
export declare function AgentChatShell({ variant, controller, brandName, slots, suggestions, emptyTitle, emptyDescription, placeholder, className, open, onClose, onExpand, panelWidth }: AgentChatShellProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=AgentChatShell.d.ts.map