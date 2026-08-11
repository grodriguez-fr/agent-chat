import test from "node:test";
import assert from "node:assert/strict";
import { buildThreadBlocks, formatDuration, groupConversations, normalizeToolStatus } from "../dist/core/index.js";

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
