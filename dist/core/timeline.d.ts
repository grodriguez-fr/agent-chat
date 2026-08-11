import type { AgentMessage, AgentToolActivity, ConversationSummary, ToolStatus } from "./types.js";
export declare function normalizeToolStatus(status?: string): ToolStatus;
export declare function messageText(message: AgentMessage): string;
export declare function messageTools(message: AgentMessage): AgentToolActivity[];
export type ThreadBlock = {
    type: "message";
    message: AgentMessage;
} | {
    type: "execution";
    id: string;
    messages: AgentMessage[];
    finalMessage?: AgentMessage;
    live: boolean;
    durationMs: number | null;
};
export declare function buildThreadBlocks(messages: AgentMessage[], streaming: boolean): ThreadBlock[];
export declare function groupConversations(conversations: ConversationSummary[], now?: Date): Array<{
    label: string;
    items: ConversationSummary[];
}>;
export declare function formatDuration(milliseconds: number): string;
//# sourceMappingURL=timeline.d.ts.map