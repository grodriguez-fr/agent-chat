import type { AgentMessage, AgentRole, AgentToolDiff } from "./types.js";
/** Presentation adapter for the existing Talos / Job Finder stores. No persistence. */
export type LegacyAgentMessage = {
    id: string;
    role: AgentRole;
    content: string;
    kind?: string;
    streaming?: boolean;
    queued?: boolean;
    toolCallId?: string;
    toolName?: string;
    status?: string;
    description?: string;
    command?: string;
    output?: string;
    path?: string;
    diffs?: AgentToolDiff[];
    createdAt?: number;
    startedAt?: number;
    endedAt?: number;
    durationMs?: number;
};
export declare function fromLegacyMessages(messages: LegacyAgentMessage[]): AgentMessage[];
//# sourceMappingURL=legacy-messages.d.ts.map