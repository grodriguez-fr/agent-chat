import { type AgentToolActivity } from "../core/index.js";
import { type AgentToolUpdate, type JsonRecord, type ParseStreamOptions } from "./events.js";
export declare function isMeaningfulToolTitle(title: string | undefined | null): boolean;
export declare function parseToolUpdate(value: JsonRecord, options?: ParseStreamOptions): AgentToolUpdate | null;
export declare function mergeAgentToolUpdate(previous: AgentToolActivity | undefined, update: AgentToolUpdate): AgentToolActivity;
//# sourceMappingURL=tool-updates.d.ts.map