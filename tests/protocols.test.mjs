import test from "node:test";
import assert from "node:assert/strict";
import { parseAcpJsonRpc, parseAiSdkDataStream } from "../dist/client/index.js";

test("parses ACP text and tool updates", () => {
  const text = parseAcpJsonRpc(JSON.stringify({ method: "session/update", params: { update: { sessionUpdate: "agent_message_chunk", content: { text: "hello" } } } }));
  assert.deepEqual(text, [{ type: "text", text: "hello" }]);
  const tool = parseAcpJsonRpc(JSON.stringify({ method: "session/update", params: { update: { sessionUpdate: "tool_call_update", toolCallId: "1", title: "read_file", status: "completed" } } }));
  assert.equal(tool[0].tool.title, "read file");
  assert.equal(tool[0].tool.status, "completed");
});

test("parses AI SDK data stream", () => {
  const events = parseAiSdkDataStream('0:"hello"\n2:[{"type":"tool-status","id":"x","title":"bash","status":"running"}]\nd:{}');
  assert.deepEqual(events.map((event) => event.type), ["text", "tool", "done"]);
});
