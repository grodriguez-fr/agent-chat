import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
for (const key of ["window", "document", "navigator", "HTMLElement", "Node", "KeyboardEvent", "Event"]) {
  Object.defineProperty(globalThis, key, { value: key === "window" ? dom.window : dom.window[key], configurable: true, writable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

const React = await import("react");
const { act } = React;
const { createRoot } = await import("react-dom/client");
const { AgentComposer } = await import("../dist/react/index.js");

test.after(() => dom.window.close());

/** Type like a user: React only sees value changes made through the native setter. */
function typeValue(textarea, value) {
  Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value").set.call(textarea, value);
  textarea.setSelectionRange(value.length, value.length);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

const offers = [
  { id: "12", label: "Mistral · ML Engineer", description: "#12", insert: "@offre:12" },
  { id: "31", label: "Mila · Research", description: "#31", insert: "@offre:31" },
];

async function mount(initial, search = (query) => offers.filter((offer) => offer.label.toLowerCase().includes(query))) {
  const sent = [];
  let setValue;
  function Harness() {
    const [input, setInput] = React.useState(initial);
    setValue = setInput;
    return React.createElement(AgentComposer, { controller: {
      status: "ready", messages: [], input, setInput, send: (text) => { sent.push(text); },
      triggers: [{ char: "@", search, label: "Offres", emptyLabel: "Aucune offre" }],
    } });
  }
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(React.createElement(Harness)));
  const textarea = container.querySelector("textarea");
  await act(async () => { textarea.focus(); textarea.setSelectionRange(initial.length, initial.length); textarea.dispatchEvent(new Event("select", { bubbles: true })); });
  const key = (name, init = {}) => act(async () => { textarea.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true, ...init })); });
  return { container, textarea, sent, key, root, setValue };
}

test("Enter inserts the active suggestion instead of sending", async () => {
  const { container, textarea, sent, key, root } = await mount("Compare @m");
  const options = container.querySelectorAll('[role="option"]');
  assert.equal(options.length, 2);
  assert.equal(textarea.getAttribute("aria-activedescendant"), options[0].id);
  await key("ArrowDown");
  assert.equal(container.querySelector('[aria-selected="true"]').textContent, "Mila · Research#31");
  await key("Enter");
  assert.equal(textarea.value, "Compare @offre:31 ");
  assert.equal(textarea.selectionStart, 18);
  assert.deepEqual(sent, []);
  assert.equal(container.querySelector('[role="listbox"]'), null);
  await key("Enter");
  assert.deepEqual(sent, ["Compare @offre:31"]);
  await act(async () => root.unmount());
});

test("Escape closes the list without closing the panel, then Enter sends", async () => {
  const { container, sent, key, root } = await mount("@mis");
  assert.ok(container.querySelector('[role="listbox"]'));
  let prevented = false;
  container.addEventListener("keydown", (event) => { prevented = event.defaultPrevented; });
  await key("Escape");
  assert.equal(prevented, true);
  assert.equal(container.querySelector('[role="listbox"]'), null);
  await key("Enter");
  assert.deepEqual(sent, ["@mis"]);
  await act(async () => root.unmount());
});

test("async results are applied in order and empty results show the empty label", async () => {
  let resolveSlow;
  const search = (query) => query === "m" ? new Promise((resolve) => { resolveSlow = resolve; }) : Promise.resolve([]);
  const { container, textarea, root } = await mount("@m", search);
  try {
    await act(async () => typeValue(textarea, "@mz"));
    await act(async () => { resolveSlow(offers); });
    assert.equal(textarea.value, "@mz");
    assert.equal(container.querySelector('[role="listbox"]'), null);
    assert.equal(container.querySelector('[role="status"]')?.textContent, "Aucune offre");
  } finally {
    await act(async () => root.unmount());
  }
});
