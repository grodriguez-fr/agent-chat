import { Wrench } from "lucide-react";
import type { AgentChatSlots, AgentMessage, AgentMessagePart, AgentToolActivity } from "../core/index.js";
type Action = {
    ongoing: string;
    done: string;
    icon: typeof Wrench;
};
/** Common tool labels live in the package so each application gets the same presentation. */
export declare function toolAction(tool: AgentToolActivity): Action;
export declare function ToolRow({ tool, slots }: {
    tool: AgentToolActivity;
    slots?: AgentChatSlots;
}): import("react").JSX.Element;
export declare function ToolActivity({ parts, slots, live }: {
    parts: AgentMessagePart[];
    slots?: AgentChatSlots;
    live?: boolean;
}): import("react").JSX.Element;
/** Default execution activity shared by page and panel consumers. */
export declare function ActivityFeed({ messages, live, slots }: {
    messages: AgentMessage[];
    live: boolean;
    slots?: AgentChatSlots;
}): import("react").JSX.Element;
export {};
//# sourceMappingURL=ToolActivity.d.ts.map