import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentChatShell } from "../dist/react/index.js";

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
