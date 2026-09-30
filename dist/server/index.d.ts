export type GatewayTurnRequest = {
    runtime?: string;
    model?: string;
    effort?: string;
    prompt?: string;
    message?: string;
    systemPrompt?: string;
    history?: Array<{
        role: string;
        content: string;
    }>;
    attachments?: Array<{
        name?: string;
        data: string;
        mimeType: string;
    }>;
    mcp?: {
        url: string;
        name?: string;
        headers?: Record<string, string>;
    };
    apiKey?: string;
};
export type GatewayClientOptions = {
    url: string;
    secret?: string;
    signal?: AbortSignal;
    fetchImpl?: typeof fetch;
    attempts?: number;
    retryDelayMs?: number;
};
export declare class GatewayTurnError extends Error {
    readonly status: number;
    readonly body: string;
    constructor(status: number, body: string);
}
/** Retries only before accepting a response body; never replays a streamed turn. */
export declare function fetchGatewayTurn(body: GatewayTurnRequest, options: GatewayClientOptions): Promise<Response>;
//# sourceMappingURL=index.d.ts.map