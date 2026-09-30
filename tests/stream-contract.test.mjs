import test from 'node:test';
import assert from 'node:assert/strict';
import { AgentDataStreamParser, parseAiSdkDataStream, parseAcpJsonRpc, mergeAgentToolUpdate, readAgentDataStream, agentEventToAcpUpdate } from '../dist/client/index.js';
import { fetchGatewayTurn } from '../dist/server/index.js';

const line = (prefix, value) => prefix + JSON.stringify(value) + '\n';
const body = (...lines) => new Response(lines.join('')).body;

test('HTTP to ACP adaptation retains thought, plans, usage and partial tool metadata', () => {
  const input = [
    { type: 'reasoning', text: 'Réflexion' },
    { type: 'plan', entries: [{ content: 'Lire', status: 'pending', priority: 'high' }] },
    { type: 'usage', estimatedCostUsd: 0.1 },
    { type: 'tool', tool: { id: 't', title: 'read_file', status: 'running', path: 'a.ts', diffs: [{ path: 'a.ts', newText: 'new' }] } },
    { type: 'tool', tool: { id: 't', output: 'result' } },
  ];
  const seen = new Set();
  const events = input.flatMap(event => parseAcpJsonRpc(JSON.stringify({ method: 'session/update', params: { update: agentEventToAcpUpdate(event, seen) } })));
  assert.equal(events[0].text, 'Réflexion');
  assert.deepEqual(events[1].entries, input[1].entries);
  assert.equal(events[2].estimatedCostUsd, 0.1);
  assert.equal(events[3].tool.diffs[0].newText, 'new');
  assert.equal(events[4].tool.title, undefined);
  assert.equal(events[4].tool.status, undefined);
  assert.equal(events[4].tool.output, 'result');
});

test('product trust adapters can retain their own rejected status', () => {
  const raw = line('2:', [{ type: 'tool-status', id: 't', status: 'rejected' }]);
  assert.equal(parseAiSdkDataStream(raw, { preserveToolStatuses: true })[0].tool.status, 'rejected');
});

test('preserves plans, cost, diffs and the terminal reason', () => {
  const events = parseAiSdkDataStream([
    line('g:', 'Je réfléchis'),
    line('2:', [{ type: 'plan', entries: [{ content: 'Lire', status: 'pending' }] }]),
    line('2:', [{ type: 'usage', estimatedCostUsd: 0.1 }]),
    line('2:', [{ type: 'tool-status', id: 't', title: 'edit_file', status: 'cancelled', path: 'a.ts', diffs: [{ path: 'a.ts', oldText: 'a', newText: 'b' }] }]),
    line('d:', { finishReason: 'cancelled' }),
  ].join(''));
  assert.deepEqual(events.map(event => event.type), ['reasoning', 'plan', 'usage', 'tool', 'done']);
  assert.equal(events[2].estimatedCostUsd, 0.1);
  assert.equal(events[3].tool.status, 'cancelled');
  assert.equal(events[3].tool.diffs[0].newText, 'b');
  assert.equal(events[4].finishReason, 'cancelled');
});

test('incremental parsing handles every character boundary, CRLF and unterminated final line', () => {
  const wire = '0:"émoji 😀"\r\n2:[{"type":"heartbeat"}]\r\nd:{"finishReason":"stop"}';
  const expected = parseAiSdkDataStream(wire);
  for (let split = 0; split <= wire.length; split++) {
    const parser = new AgentDataStreamParser({ strict: true });
    assert.deepEqual([...parser.push(wire.slice(0, split)), ...parser.push(wire.slice(split)), ...parser.flush()], expected);
  }
});

test('partial tool updates retain names, output, paths, diffs and running state', () => {
  const first = parseAiSdkDataStream(line('2:', [{ type: 'tool-status', id: 't', title: 'read_file', status: 'running', path: 'a.ts', output: 'old' }]))[0].tool;
  const patch = parseAiSdkDataStream(line('2:', [{ type: 'tool-status', id: 't', detail: 'new' }]))[0].tool;
  assert.equal(patch.title, undefined);
  assert.equal(patch.status, undefined);
  const merged = mergeAgentToolUpdate(mergeAgentToolUpdate(undefined, first), patch);
  assert.equal(merged.title, 'read file');
  assert.equal(merged.status, 'running');
  assert.equal(merged.path, 'a.ts');
  assert.equal(merged.output, 'old');
  assert.equal(merged.detail, 'new');
});

test('does not invent success for truncated, malformed, failed or cancelled streams', async () => {
  await assert.rejects(readAgentDataStream(body(line('0:', 'partial'))), /interrompu/);
  await assert.rejects(readAgentDataStream(body('d:{broken}\n')), /invalide/);
  await assert.rejects(readAgentDataStream(body(line('3:', 'quota'), line('d:', { finishReason: 'stop' }))), /quota/);
  await assert.rejects(readAgentDataStream(body(line('d:', { finishReason: 'error' }))), /error/);
  await assert.rejects(readAgentDataStream(body(line('d:', { finishReason: 'cancelled' }))), /cancelled/);
  await assert.rejects(readAgentDataStream(body(line('d:', {}), line('0:', 'late'))), /après la fin/);
});

test('stream reading preserves UTF-8 across bytes and cancels a pending read on abort', async () => {
  const bytes = new TextEncoder().encode(line('0:', 'é😀') + line('d:', { finishReason: 'stop' }));
  const stream = new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); } });
  const events = [];
  await readAgentDataStream(stream, { onEvent: event => { events.push(event); } });
  assert.equal(events[0].text, 'é😀');
  let cancelled = false;
  const abort = new AbortController();
  const pending = readAgentDataStream(new ReadableStream({ cancel() { cancelled = true; } }), { signal: abort.signal });
  abort.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(cancelled, true);
});

test('ACP parsing preserves thought updates and missing metadata', () => {
  const events = parseAcpJsonRpc(JSON.stringify({ method: 'session/update', params: { update: { sessionUpdate: 'agent_thought_chunk', content: { type: 'text', text: 'penser' } } } }));
  assert.deepEqual(events, [{ type: 'reasoning', text: 'penser' }]);
  const patch = parseAcpJsonRpc(JSON.stringify({ method: 'session/update', params: { update: { sessionUpdate: 'tool_call_update', toolCallId: 't', status: 'completed' } } }))[0].tool;
  assert.equal(patch.title, undefined);
  assert.equal(patch.status, 'completed');
});

test('shared HTTP client retries pre-stream errors and sends the same runtime and auth', async () => {
  const calls = [];
  const fetchImpl = async (url, request) => {
    calls.push({ url: String(url), request });
    return calls.length === 1 ? new Response('temporary', { status: 503 }) : new Response(line('d:', {}), { headers: { 'X-Agent-Event-Contract': '1' } });
  };
  await fetchGatewayTurn({ runtime: 'codex', effort: 'high', prompt: 'hello' }, { url: 'https://gateway.example/base', secret: 'test', retryDelayMs: 0, fetchImpl });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://gateway.example/base/v1/turns');
  assert.equal(calls[0].request.headers.Authorization, 'Bearer test');
  assert.equal(JSON.parse(calls[1].request.body).runtime, 'codex');
});

test('shared HTTP client rejects incompatible contracts and never retries a received successful stream', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return new Response(line('0:', 'partial'), { headers: { 'X-Agent-Event-Contract': '2' } }); };
  await assert.rejects(fetchGatewayTurn({ prompt: 'hello' }, { url: 'https://gateway.example', fetchImpl }), /Contrat/);
  assert.equal(calls, 1);
});
