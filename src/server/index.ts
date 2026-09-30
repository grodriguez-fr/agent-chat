export type GatewayTurnRequest = {
  runtime?: string;
  model?: string;
  effort?: string;
  prompt?: string;
  message?: string;
  systemPrompt?: string;
  history?: Array<{ role: string; content: string }>;
  attachments?: Array<{ name?: string; data: string; mimeType: string }>;
  mcp?: { url: string; name?: string; headers?: Record<string, string> };
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

export class GatewayTurnError extends Error {
  constructor(public readonly status: number, public readonly body: string) {
    super("Gateway HTTP " + status + (body ? " : " + body.slice(0, 500) : ""));
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(signal.reason); return; }
    const abort = () => { clearTimeout(timer); signal?.removeEventListener("abort", abort); reject(signal?.reason); };
    const timer = setTimeout(() => { signal?.removeEventListener("abort", abort); resolve(); }, ms);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

/** Retries only before accepting a response body; never replays a streamed turn. */
export async function fetchGatewayTurn(body: GatewayTurnRequest, options: GatewayClientOptions): Promise<Response> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const attempts = Math.max(1, Math.min(options.attempts ?? 2, 3));
  const url = new URL("v1/turns", options.url.replace(/\/$/, "") + "/");
  for (let attempt = 0; attempt < attempts; attempt++) {
    options.signal?.throwIfAborted();
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/plain", ...(options.secret ? { Authorization: "Bearer " + options.secret } : {}) },
        body: JSON.stringify(body), signal: options.signal,
      });
    } catch (error) {
      if (options.signal?.aborted || attempt === attempts - 1) throw error;
      await delay(options.retryDelayMs ?? 500, options.signal);
      continue;
    }
    if ([502, 503, 504].includes(response.status) && attempt < attempts - 1) {
      await response.body?.cancel();
      await delay(options.retryDelayMs ?? 500, options.signal);
      continue;
    }
    if (!response.ok) throw new GatewayTurnError(response.status, await response.text().catch(() => ""));
    if (!response.body) throw new Error("Le gateway n'a renvoyé aucun flux.");
    const contract = response.headers.get("X-Agent-Event-Contract");
    if (contract && contract !== "1") {
      await response.body.cancel();
      throw new Error("Contrat du gateway non pris en charge : " + contract);
    }
    return response;
  }
  throw new Error("Agent gateway unavailable");
}
