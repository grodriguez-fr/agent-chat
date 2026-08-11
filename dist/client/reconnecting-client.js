export class AgentStreamClient {
    options;
    socket = null;
    reconnectTimer = null;
    keepAliveTimer = null;
    attempts = 0;
    stopped = true;
    constructor(options) {
        this.options = options;
    }
    connect() {
        if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING)
            return;
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
            if (typeof event.data !== "string")
                return;
            for (const parsed of this.options.protocol.parse(event.data))
                this.options.onEvent(parsed);
        };
        socket.onerror = () => this.options.onError?.("Connexion agent impossible");
        socket.onclose = () => {
            this.socket = null;
            this.clearKeepAlive();
            this.options.onState?.("closed");
            if (!this.stopped)
                this.scheduleReconnect();
        };
    }
    send(payload) {
        if (this.socket?.readyState !== WebSocket.OPEN)
            return false;
        this.socket.send(payload);
        return true;
    }
    disconnect() {
        this.stopped = true;
        this.clearReconnect();
        this.clearKeepAlive();
        this.socket?.close();
        this.socket = null;
    }
    scheduleReconnect() {
        const initial = this.options.reconnect?.initialMs ?? 1_000;
        const maximum = this.options.reconnect?.maximumMs ?? 20_000;
        const delay = Math.min(maximum, initial * 2 ** Math.min(this.attempts++, 5));
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
    }
    startKeepAlive() {
        this.clearKeepAlive();
        if (!this.options.protocol.keepAlive)
            return;
        this.keepAliveTimer = setInterval(() => {
            const payload = this.options.protocol.keepAlive?.();
            if (payload)
                this.send(payload);
        }, this.options.keepAliveMs ?? 20_000);
    }
    clearReconnect() {
        if (this.reconnectTimer)
            clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }
    clearKeepAlive() {
        if (this.keepAliveTimer)
            clearInterval(this.keepAliveTimer);
        this.keepAliveTimer = null;
    }
}
//# sourceMappingURL=reconnecting-client.js.map