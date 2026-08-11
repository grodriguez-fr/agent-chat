import type { AgentClientEvent } from "./protocols.js";
export type AgentStreamProtocol = {
    parse: (raw: string) => AgentClientEvent[];
    keepAlive?: () => string | null;
};
export type AgentStreamClientOptions = {
    url: () => string;
    protocol: AgentStreamProtocol;
    onEvent: (event: AgentClientEvent) => void;
    onState?: (state: "connecting" | "open" | "closed") => void;
    onError?: (message: string) => void;
    reconnect?: {
        initialMs?: number;
        maximumMs?: number;
    };
    keepAliveMs?: number;
};
export declare class AgentStreamClient {
    private readonly options;
    private socket;
    private reconnectTimer;
    private keepAliveTimer;
    private attempts;
    private stopped;
    constructor(options: AgentStreamClientOptions);
    connect(): void;
    send(payload: string): boolean;
    disconnect(): void;
    private scheduleReconnect;
    private startKeepAlive;
    private clearReconnect;
    private clearKeepAlive;
}
//# sourceMappingURL=reconnecting-client.d.ts.map