import test from "node:test";
import assert from "node:assert/strict";
import { buildThreadBlocks, formatDuration, fromLegacyMessages, groupConversations, normalizeToolStatus } from "../dist/core/index.js";

test("normalizes provider tool statuses", () => {
  assert.equal(normalizeToolStatus("in_progress"), "running");
  assert.equal(normalizeToolStatus("success"), "completed");
  assert.equal(normalizeToolStatus("timeout"), "failed");
});

test("separates activity from the final assistant answer", () => {
  const messages = [
    { id: "u", role: "user", createdAt: 1_000, parts: [{ type: "text", text: "Fix" }] },
    { id: "a", role: "assistant", endedAt: 3_000, parts: [
      { type: "reasoning", text: "Inspecting" },
      { type: "tool", tool: { id: "t", title: "Read", status: "completed" } },
      { type: "text", text: "Fixed." },
    ] },
  ];
  const blocks = buildThreadBlocks(messages, false);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[1].type, "execution");
  assert.equal(blocks[1].durationMs, 2_000);
  assert.equal(blocks[1].messages[0].parts.length, 2);
  assert.equal(blocks[1].finalMessage.parts[0].text, "Fixed.");
});

test("groups conversations by relative date", () => {
  const now = new Date("2026-08-12T12:00:00Z");
  const groups = groupConversations([
    { id: "1", title: "Today", createdAt: now.getTime(), updatedAt: now.getTime() },
    { id: "2", title: "Old", createdAt: 1, updatedAt: 1 },
  ], now);
  assert.deepEqual(groups.map((group) => group.label), ["Aujourd’hui", "Plus ancien"]);
  assert.equal(formatDuration(65_000), "1m 05s");
});

test("preserves commentary before tools and shows only the final answer outside activity", () => {
  const blocks = buildThreadBlocks([
    { id: "u", role: "user", parts: [{ type: "text", text: "Question" }] },
    { id: "a", role: "assistant", parts: [
      { type: "text", text: "Je vérifie." },
      { type: "tool", tool: { id: "t", title: "Lire", status: "completed" } },
      { type: "text", text: "Voici le résultat." },
    ] },
  ], false);
  assert.equal(blocks[1].messages[0].parts[0].text, "Je vérifie.");
  assert.equal(blocks[1].messages[0].sourceId, "a");
  assert.equal(blocks[1].finalMessage.id, "a");
  assert.equal(blocks[1].finalMessage.parts[0].text, "Voici le résultat.");
  assert.equal(blocks[1].durationMs, null);
});

test("Talos adapter retains diffs, output, queue and explicit execution duration", () => {
  const diffs = [{ path: "app.ts", oldText: "old", newText: "new", added: 1, removed: 1 }];
  const messages = fromLegacyMessages([
    { id: "u", role: "user", content: "Corrige", createdAt: 0 },
    { id: "t", role: "tool", content: "", toolName: "write_file", status: "completed", output: "OK", diffs },
    { id: "a", role: "assistant", content: "Corrigé" },
    { id: "w", role: "system", kind: "worked", content: "Worked", durationMs: 4500 },
    { id: "q", role: "user", content: "Suite", queued: true },
  ]);
  assert.deepEqual(messages[1].parts[0].tool.diffs, diffs);
  assert.equal(messages[1].parts[0].tool.output, "OK");
  const blocks = buildThreadBlocks(messages, false);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[1].durationMs, 4500);
  assert.equal(blocks[1].messages.length, 1);
});
