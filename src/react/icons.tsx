import { createContext, useContext, type ReactNode } from "react";
import { ArrowUp, Brain, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clock3, Copy, FilePenLine, FileSearch, Globe, LoaderCircle, Maximize2, Menu, Mic, Paperclip, Pencil, Pin, PinOff, Plus, RotateCcw, Search, Square, Terminal, Trash2, WrapText, Wrench, X, type LucideIcon } from "lucide-react";

/** Every icon the chat draws, named by role so each application can pick its own icon set. */
export type ChatIconName =
  | "add" | "close" | "menu" | "expand" | "search" | "check" | "edit" | "delete" | "pin" | "unpin"
  | "chevron-down" | "chevron-left" | "chevron-right" | "copy" | "retry" | "wrap"
  | "send" | "arrow-up" | "stop" | "mic" | "attach" | "queued" | "spinner"
  | "thinking" | "tool" | "file-search" | "file-edit" | "web" | "terminal" | "error";

/**
 * `className` always contains `agent-chat__icon` (the stylesheet colours and sizes icons through it),
 * plus `is-spinning` for the spinner. A renderer must put it on the element it returns.
 */
export type ChatIconProps = { name: ChatIconName; size: number; className: string };
export type ChatIconRenderer = (props: ChatIconProps) => ReactNode;

const lucide: Record<ChatIconName, LucideIcon> = {
  add: Plus, close: X, menu: Menu, expand: Maximize2, search: Search, check: Check, edit: Pencil, delete: Trash2,
  pin: Pin, unpin: PinOff, "chevron-down": ChevronDown, "chevron-left": ChevronLeft, "chevron-right": ChevronRight,
  copy: Copy, retry: RotateCcw, wrap: WrapText, send: ArrowUp, "arrow-up": ArrowUp, stop: Square, mic: Mic,
  attach: Paperclip, queued: Clock3, spinner: LoaderCircle, thinking: Brain, tool: Wrench, "file-search": FileSearch,
  "file-edit": FilePenLine, web: Globe, terminal: Terminal, error: CircleAlert,
};

/** Default renderer: the Lucide icons the chat has always used. */
export const lucideChatIcons: ChatIconRenderer = ({ name, size, className }) => {
  const Icon = lucide[name];
  return <Icon size={size} className={className} aria-hidden strokeWidth={name === "send" ? 2.5 : undefined} fill={name === "stop" ? "currentColor" : undefined} />;
};

const ChatIconContext = createContext<ChatIconRenderer>(lucideChatIcons);

/** Replaces the chat icons below it, e.g. with the application's own icon font. */
export function ChatIconsProvider({ icons, children }: { icons: ChatIconRenderer; children: ReactNode }) {
  return <ChatIconContext.Provider value={icons}>{children}</ChatIconContext.Provider>;
}

export function ChatIcon({ name, size, className }: { name: ChatIconName; size: number; className?: string }) {
  const render = useContext(ChatIconContext);
  const spinning = name === "spinner" ? " is-spinning" : "";
  return <>{render({ name, size, className: `agent-chat__icon${spinning}${className ? ` ${className}` : ""}` })}</>;
}
