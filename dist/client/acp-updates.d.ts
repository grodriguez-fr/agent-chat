import type { AgentClientEvent, JsonRecord } from "./events.js";
/** Adapt the shared HTTP event contract to the existing ACP browser transport. */
export declare function agentEventToAcpUpdate(event: AgentClientEvent, seenTools: Set<string>): JsonRecord | null;
//# sourceMappingURL=acp-updates.d.ts.map