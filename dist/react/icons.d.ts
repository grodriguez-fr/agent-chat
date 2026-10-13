import { type ReactNode } from "react";
/** Every icon the chat draws, named by role so each application can pick its own icon set. */
export type ChatIconName = "add" | "close" | "menu" | "expand" | "search" | "check" | "edit" | "delete" | "pin" | "unpin" | "chevron-down" | "chevron-left" | "chevron-right" | "copy" | "retry" | "wrap" | "send" | "arrow-up" | "stop" | "mic" | "attach" | "queued" | "spinner" | "thinking" | "tool" | "file-search" | "file-edit" | "web" | "terminal" | "error";
/**
 * `className` always contains `agent-chat__icon` (the stylesheet colours and sizes icons through it),
 * plus `is-spinning` for the spinner. A renderer must put it on the element it returns.
 */
export type ChatIconProps = {
    name: ChatIconName;
    size: number;
    className: string;
};
export type ChatIconRenderer = (props: ChatIconProps) => ReactNode;
/** Default renderer: the Lucide icons the chat has always used. */
export declare const lucideChatIcons: ChatIconRenderer;
/** Replaces the chat icons below it, e.g. with the application's own icon font. */
export declare function ChatIconsProvider({ icons, children }: {
    icons: ChatIconRenderer;
    children: ReactNode;
}): import("react").JSX.Element;
export declare function ChatIcon({ name, size, className }: {
    name: ChatIconName;
    size: number;
    className?: string;
}): import("react").JSX.Element;
//# sourceMappingURL=icons.d.ts.map