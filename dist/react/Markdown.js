import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, isValidElement, useMemo, useState } from "react";
import { Check, Copy, WrapText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { execInlineToken, splitInlineTokens } from "../core/index.js";
/** Remark plugin turning token matches in text nodes into `span[data-agent-token]`. */
function remarkInlineTokens(tokens) {
    const visit = (node) => {
        if (!node.children || node.type === "link" || node.type === "linkReference")
            return;
        node.children = node.children.flatMap((child) => {
            if (child.type !== "text" || !child.value) {
                visit(child);
                return [child];
            }
            return splitInlineTokens(child.value, tokens).map((segment) => segment.type === "text"
                ? { type: "text", value: segment.text }
                : { type: "agentToken", value: segment.text, data: { hName: "span", hProperties: { dataAgentToken: segment.tokenIndex }, hChildren: [{ type: "text", value: segment.text }] } });
        });
    };
    return () => (tree) => { visit(tree); };
}
function renderToken(tokens, tokenIndex, text) {
    const token = tokens[tokenIndex];
    const match = token && execInlineToken(token, text);
    return match ? token.render(match) : text;
}
/** Plain text with inline tokens, used for user messages. */
export function AgentInlineText({ text, tokens }) {
    if (!tokens?.length)
        return _jsx(_Fragment, { children: text });
    return _jsx(_Fragment, { children: splitInlineTokens(text, tokens).map((segment, index) => _jsx(Fragment, { children: segment.type === "text" ? segment.text : renderToken(tokens, segment.tokenIndex, segment.text) }, index)) });
}
function textFromNode(node) {
    if (node == null || typeof node === "boolean")
        return "";
    if (typeof node === "string" || typeof node === "number")
        return String(node);
    if (Array.isArray(node))
        return node.map(textFromNode).join("");
    if (isValidElement(node))
        return textFromNode(node.props.children);
    return "";
}
function CodeBlock({ children }) {
    const element = isValidElement(children) ? children : null;
    const code = element?.props.children ?? children;
    const language = element?.props.className?.match(/(?:^|\s)language-([^\s]+)/)?.[1] ?? "code";
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState(false);
    const [wrap, setWrap] = useState(false);
    async function copy() {
        try {
            await navigator.clipboard.writeText(textFromNode(code).replace(/\n$/, ""));
            setCopied(true);
            setCopyError(false);
            window.setTimeout(() => setCopied(false), 1800);
        }
        catch {
            setCopyError(true);
        }
    }
    return _jsxs("figure", { className: "agent-chat__code-block", children: [_jsxs("figcaption", { children: [_jsx("span", { children: language }), _jsxs("div", { children: [_jsx("button", { type: "button", onClick: () => setWrap(!wrap), "aria-label": wrap ? "Désactiver le retour à la ligne" : "Activer le retour à la ligne", "aria-pressed": wrap, title: "Retour \u00E0 la ligne", children: _jsx(WrapText, { size: 14 }) }), _jsxs("button", { type: "button", onClick: () => void copy(), "aria-label": copied ? "Copié" : "Copier le code", children: [copied ? _jsx(Check, { size: 14 }) : _jsx(Copy, { size: 14 }), _jsx("span", { children: copied ? "Copié" : "Copier" })] })] })] }), _jsx("pre", { tabIndex: 0, className: wrap ? "is-wrapped" : undefined, children: _jsx("code", { className: element?.props.className, children: code }) }), copyError && _jsx("p", { className: "agent-chat__code-error", role: "status", children: "Copie indisponible" })] });
}
export function AgentMarkdown({ children, streaming = false, tokens }) {
    const plugins = useMemo(() => tokens?.length ? [remarkGfm, remarkInlineTokens(tokens)] : [remarkGfm], [tokens]);
    const components = useMemo(() => ({
        pre: CodeBlock,
        ...(tokens?.length ? {
            span: ({ node, children: content, ...props }) => {
                const tokenIndex = node?.properties?.dataAgentToken;
                return tokenIndex == null ? _jsx("span", { ...props, children: content }) : renderToken(tokens, Number(tokenIndex), textFromNode(content));
            },
        } : {}),
    }), [tokens]);
    return (_jsx("div", { className: streaming ? "agent-chat__markdown agent-chat__markdown--streaming" : "agent-chat__markdown", children: _jsx(ReactMarkdown, { remarkPlugins: plugins, components: components, children: children }) }));
}
//# sourceMappingURL=Markdown.js.map