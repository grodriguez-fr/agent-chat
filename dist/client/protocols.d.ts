import { type AgentToolActivity } from "../core/index.js";
export type AgentClientEvent = {
    type: "text";
    text: string;
} | {
    type: "reasoning";
    text: string;
} | {
    type: "tool";
    tool: AgentToolActivity;
} | {
    type: "done";
} | {
    type: "error";
    message: string;
} | {
    type: "heartbeat";
};
export declare function parseAcpJsonRpc(raw: string): AgentClientEvent[];
export declare function parseAiSdkDataStream(raw: string): AgentClientEvent[];
//# sourceMappingURL=protocols.d.ts.map