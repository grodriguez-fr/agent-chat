import { type AgentClientEvent, type ParseStreamOptions } from "./events.js";
/** Parse complete lines; use AgentDataStreamParser for network chunks. */
export declare function parseAiSdkDataStream(raw: string, options?: ParseStreamOptions): AgentClientEvent[];
export declare class DataStreamLineBuffer {
    private readonly maxLineChars;
    private buffer;
    constructor(maxLineChars?: number);
    push(chunk: string): string[];
    flush(): string[];
}
export declare class AgentDataStreamParser {
    private readonly options;
    private readonly buffer;
    constructor(options?: ParseStreamOptions);
    push(chunk: string): AgentClientEvent[];
    flush(): AgentClientEvent[];
}
export type ReadAgentStreamOptions = {
    signal?: AbortSignal;
    onEvent?: (event: AgentClientEvent) => void | Promise<void>;
    onLine?: (line: string) => void | Promise<void>;
    requireDone?: boolean;
};
/** Shared terminal validation and UTF-8/chunk buffering for all server consumers. */
export declare function readAgentDataStream(body: ReadableStream<Uint8Array> | null, options?: ReadAgentStreamOptions): Promise<void>;
//# sourceMappingURL=data-stream.d.ts.map