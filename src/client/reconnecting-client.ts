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
  reconnect?: { initialMs?: number; maximumMs?: number };
  keepAliveMs?: number;
};

export class AgentStreamClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private attempts = 0;
  private stopped = true;

  constructor(private readonly options: AgentStreamClientOptions) {}

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) return;
    this.stopped = false;
    this.clearReconnect();
    this.options.onState?.("connecting");
    const socket = new WebSocket(this.options.url());
    this.socket = socket;
    socket.onopen = () => {
      this.attempts = 0;
      this.options.onState?.("open");
      this.startKeepAlive();
    };
    socket.onmessage = (event) => {
      if (typeof event.data !== "string") return;
      for (const parsed of this.options.protocol.parse(event.data)) this.options.onEvent(parsed);
    };
    socket.onerror = () => this.options.onError?.("Connexion agent impossible");
    socket.onclose = () => {
      this.socket = null;
      this.clearKeepAlive();
      this.options.onState?.("closed");
      if (!this.stopped) this.scheduleReconnect();
    };
  }

  send(payload: string): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;
    this.socket.send(payload);
    return true;
  }

  disconnect(): void {
    this.stopped = true;
    this.clearReconnect();
    this.clearKeepAlive();
    this.socket?.close();
    this.socket = null;
  }

  private scheduleReconnect(): void {
    const initial = this.options.reconnect?.initialMs ?? 1_000;
    const maximum = this.options.reconnect?.maximumMs ?? 20_000;
    const delay = Math.min(maximum, initial * 2 ** Math.min(this.attempts++, 5));
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private startKeepAlive(): void {
    this.clearKeepAlive();
    if (!this.options.protocol.keepAlive) return;
    this.keepAliveTimer = setInterval(() => {
      const payload = this.options.protocol.keepAlive?.();
      if (payload) this.send(payload);
    }, this.options.keepAliveMs ?? 20_000);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private clearKeepAlive(): void {
    if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = null;
  }
}
