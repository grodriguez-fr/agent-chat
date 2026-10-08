import test from "node:test";
import assert from "node:assert/strict";
import { applySuggestion, findTriggerMatch, splitInlineTokens } from "../dist/core/index.js";

const mention = { char: "@", search: () => [] };
const command = { char: "/", search: () => [] };

test("finds the trigger being typed at the caret", () => {
  assert.deepEqual(
    (({ query, start, end }) => ({ query, start, end }))(findTriggerMatch("Compare @mis", 12, [mention])),
    { query: "mis", start: 8, end: 12 },
  );
  assert.equal(findTriggerMatch("@", 1, [mention]).query, "");
  assert.equal(findTriggerMatch("/run", 4, [mention, command]).trigger, command);
});

test("ignores triggers inside words, after whitespace, or away from the caret", () => {
  assert.equal(findTriggerMatch("mail guillaume@olixid", 21, [mention]), null);
  assert.equal(findTriggerMatch("@mistral ai", 11, [mention]), null);
  assert.equal(findTriggerMatch("@mis and more", 13, [mention]), null);
  assert.equal(findTriggerMatch("@@", 2, [mention]), null);
  assert.equal(findTriggerMatch("@mis", 4, []), null);
  assert.equal(findTriggerMatch("@mis", 9, [mention]), null);
});

test("replaces the query and places the caret after a separating space", () => {
  assert.deepEqual(applySuggestion("Compare @mis", { start: 8, end: 12 }, "@offre:12"), { value: "Compare @offre:12 ", caret: 18 });
  assert.deepEqual(applySuggestion("@mis et @offre:3", { start: 0, end: 4 }, "@offre:12"), { value: "@offre:12 et @offre:3", caret: 10 });
  assert.deepEqual(applySuggestion("/r", { start: 0, end: 2 }, "/review "), { value: "/review ", caret: 8 });
});

test("splits text into inline token segments", () => {
  const tokens = [{ pattern: /@offre:(\d+)/g }, { pattern: /#\w+/ }];
  assert.deepEqual(splitInlineTokens("Voir @offre:12 et #tag.", tokens), [
    { type: "text", text: "Voir " },
    { type: "token", text: "@offre:12", tokenIndex: 0 },
    { type: "text", text: " et " },
    { type: "token", text: "#tag", tokenIndex: 1 },
    { type: "text", text: "." },
  ]);
  assert.deepEqual(splitInlineTokens("rien", tokens), [{ type: "text", text: "rien" }]);
  assert.deepEqual(splitInlineTokens("", tokens), []);
});
