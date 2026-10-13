import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useContext } from "react";
import { ArrowUp, Brain, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clock3, Copy, FilePenLine, FileSearch, Globe, LoaderCircle, Maximize2, Menu, Mic, Paperclip, Pencil, Pin, PinOff, Plus, RotateCcw, Search, Square, Terminal, Trash2, WrapText, Wrench, X } from "lucide-react";
const lucide = {
    add: Plus, close: X, menu: Menu, expand: Maximize2, search: Search, check: Check, edit: Pencil, delete: Trash2,
    pin: Pin, unpin: PinOff, "chevron-down": ChevronDown, "chevron-left": ChevronLeft, "chevron-right": ChevronRight,
    copy: Copy, retry: RotateCcw, wrap: WrapText, send: ArrowUp, "arrow-up": ArrowUp, stop: Square, mic: Mic,
    attach: Paperclip, queued: Clock3, spinner: LoaderCircle, thinking: Brain, tool: Wrench, "file-search": FileSearch,
    "file-edit": FilePenLine, web: Globe, terminal: Terminal, error: CircleAlert,
};
/** Default renderer: the Lucide icons the chat has always used. */
export const lucideChatIcons = ({ name, size, className }) => {
    const Icon = lucide[name];
    return _jsx(Icon, { size: size, className: className, "aria-hidden": true, strokeWidth: name === "send" ? 2.5 : undefined, fill: name === "stop" ? "currentColor" : undefined });
};
const ChatIconContext = createContext(lucideChatIcons);
/** Replaces the chat icons below it, e.g. with the application's own icon font. */
export function ChatIconsProvider({ icons, children }) {
    return _jsx(ChatIconContext.Provider, { value: icons, children: children });
}
export function ChatIcon({ name, size, className }) {
    const render = useContext(ChatIconContext);
    const spinning = name === "spinner" ? " is-spinning" : "";
    return _jsx(_Fragment, { children: render({ name, size, className: `agent-chat__icon${spinning}${className ? ` ${className}` : ""}` }) });
}
//# sourceMappingURL=icons.js.map