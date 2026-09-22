import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentChatShell, AgentComposer, AgentTimeline } from "../dist/react/index.js";
import { toolAction } from "../dist/react/ToolActivity.js";

const controller = {
  status: "ready",
  input: "",
  setInput() {},
  send() {},
  messages: [{
    id: "user-1",
    role: "user",
    parts: [{ type: "text", text: "Bonjour" }],
  }],
};

test("renders page and panel variants with product slots", () => {
  const page = renderToStaticMarkup(React.createElement(AgentChatShell, {
    variant: "page",
    brandName: "Talos",
    controller,
    slots: { headerTrailing: React.createElement("span", null, "Contexte VPS") },
  }));
  const panel = renderToStaticMarkup(React.createElement(AgentChatShell, {
    variant: "panel",
    brandName: "LOGOS",
    controller,
    open: true,
  }));
  assert.match(page, /agent-chat--page/);
  assert.match(page, /Contexte VPS/);
  assert.match(panel, /agent-chat--panel/);
});

test("hides optional conversation navigation when no handlers are provided", () => {
  const html = renderToStaticMarkup(React.createElement(AgentChatShell, {
    variant: "panel",
    brandName: "Job Finder",
    controller,
  }));
  assert.doesNotMatch(html, /agent-chat__sidebar/);
  assert.doesNotMatch(html, /aria-label="Conversations"/);
});

test("streaming keeps Stop available and disables send without queue support", () => {
  const html = renderToStaticMarkup(React.createElement(AgentComposer, {
    controller: { ...controller, status: "streaming", input: "Next", stop() {} },
  }));
  assert.match(html, /aria-label="Interrompre la réponse"/);
  assert.match(html, /class="agent-chat__send"[^>]*disabled=""/);
  const queued = renderToStaticMarkup(React.createElement(AgentComposer, {
    controller: { ...controller, status: "streaming", input: "Next", allowQueue: true },
  }));
  assert.match(queued, /aria-label="Mettre en file"/);
  assert.doesNotMatch(queued, /class="agent-chat__send"[^>]*disabled/);
});

test("attachment-only prompts can send; unsupported dictation is hidden", () => {
  const html = renderToStaticMarkup(React.createElement(AgentComposer, {
    controller: { ...controller, hasAttachments: true },
  }));
  assert.doesNotMatch(html, /class="agent-chat__send"[^>]*disabled/);
  assert.doesNotMatch(html, /Dicter un message/);
});

test("user text is plain and final answer is visible without opening tools", () => {
  const html = renderToStaticMarkup(React.createElement(AgentTimeline, { controller: { ...controller, messages: [
    { id: "u", role: "user", parts: [{ type: "text", text: "**literal**" }] },
    { id: "a", role: "assistant", parts: [{ type: "tool", tool: { id: "t", title: "Hidden tool", status: "completed" } }, { type: "text", text: "Final visible" }] },
  ] } }));
  assert.match(html, /\*\*literal\*\*/);
  assert.match(html, /Final visible/);
  assert.doesNotMatch(html, /Hidden tool/);
  assert.match(html, /aria-expanded="false"/);
});

test("shared activity hides raw tool identifiers behind natural summaries", () => {
  assert.equal(toolAction({ id: "1", title: "mcp__jobfinder__list_offres", status: "running" }).ongoing, "Consulte les offres");
  assert.equal(toolAction({ id: "2", title: "grep", status: "completed" }).done, "Recherche terminée");
  const html = renderToStaticMarkup(React.createElement(AgentTimeline, { controller: { ...controller, messages: [
    { id: "u", role: "user", parts: [{ type: "text", text: "Recherche" }], createdAt: 1000 },
    { id: "t", role: "tool", parts: [{ type: "tool", tool: { id: "1", title: "mcp__jobfinder__list_offres", status: "completed" } }], createdAt: 1100 },
    { id: "a", role: "assistant", parts: [{ type: "text", text: "Voici les offres" }], createdAt: 1200 },
  ] } }));
  assert.match(html, /Voici les offres/);
  assert.doesNotMatch(html, /mcp__jobfinder__list_offres/);
});
