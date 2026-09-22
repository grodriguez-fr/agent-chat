import { type KeyboardEventHandler } from "react";
import type { AgentChatController, AgentChatSlots } from "../core/index.js";
export type AgentComposerProps = {
    controller: AgentChatController;
    slots?: AgentChatSlots;
    placeholder?: string;
    settingsMenuSide?: "up" | "down";
    onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
};
export declare function AgentComposer({ controller, slots, placeholder, settingsMenuSide, onKeyDown }: AgentComposerProps): import("react").JSX.Element;
//# sourceMappingURL=Composer.d.ts.map