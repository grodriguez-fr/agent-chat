import { Fragment, isValidElement, useMemo, useState, type ReactNode } from "react";
import { Check, Copy, WrapText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { execInlineToken, splitInlineTokens, type InlineToken } from "../core/index.js";

type MdNode = { type: string; value?: string; children?: MdNode[]; data?: Record<string, unknown> };

/** Remark plugin turning token matches in text nodes into `span[data-agent-token]`. */
function remarkInlineTokens(tokens: readonly InlineToken[]) {
  const visit = (node: MdNode) => {
    if (!node.children || node.type === "link" || node.type === "linkReference") return;
    node.children = node.children.flatMap((child) => {
      if (child.type !== "text" || !child.value) { visit(child); return [child]; }
      return splitInlineTokens(child.value, tokens).map((segment): MdNode => segment.type === "text"
        ? { type: "text", value: segment.text }
        : { type: "agentToken", value: segment.text, data: { hName: "span", hProperties: { dataAgentToken: segment.tokenIndex }, hChildren: [{ type: "text", value: segment.text }] } });
    });
  };
  return () => (tree: MdNode) => { visit(tree); };
}

function renderToken(tokens: readonly InlineToken[], tokenIndex: number, text: string) {
  const token = tokens[tokenIndex];
  const match = token && execInlineToken(token, text);
  return match ? token.render(match) : text;
}

/** Plain text with inline tokens, used for user messages. */
export function AgentInlineText({ text, tokens }: { text: string; tokens?: readonly InlineToken[] }) {
  if (!tokens?.length) return <>{text}</>;
  return <>{splitInlineTokens(text, tokens).map((segment, index) => <Fragment key={index}>{segment.type === "text" ? segment.text : renderToken(tokens, segment.tokenIndex, segment.text)}</Fragment>)}</>;
}

function textFromNode(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textFromNode(node.props.children);
  return "";
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const element = isValidElement<{ children?: ReactNode; className?: string }>(children) ? children : null;
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
    } catch { setCopyError(true); }
  }
  return <figure className="agent-chat__code-block">
    <figcaption><span>{language}</span><div>
      <button type="button" onClick={() => setWrap(!wrap)} aria-label={wrap ? "Désactiver le retour à la ligne" : "Activer le retour à la ligne"} aria-pressed={wrap} title="Retour à la ligne"><WrapText size={14} /></button>
      <button type="button" onClick={() => void copy()} aria-label={copied ? "Copié" : "Copier le code"}>{copied ? <Check size={14} /> : <Copy size={14} />}<span>{copied ? "Copié" : "Copier"}</span></button>
    </div></figcaption>
    <pre tabIndex={0} className={wrap ? "is-wrapped" : undefined}><code className={element?.props.className}>{code}</code></pre>
    {copyError && <p className="agent-chat__code-error" role="status">Copie indisponible</p>}
  </figure>;
}

export function AgentMarkdown({ children, streaming = false, tokens }: { children: string; streaming?: boolean; tokens?: readonly InlineToken[] }) {
  const plugins = useMemo(() => tokens?.length ? [remarkGfm, remarkInlineTokens(tokens)] : [remarkGfm], [tokens]);
  const components = useMemo(() => ({
    pre: CodeBlock,
    ...(tokens?.length ? {
      span: ({ node, children: content, ...props }: { node?: { properties?: Record<string, unknown> }; children?: ReactNode }) => {
        const tokenIndex = node?.properties?.dataAgentToken;
        return tokenIndex == null ? <span {...props}>{content}</span> : renderToken(tokens, Number(tokenIndex), textFromNode(content));
      },
    } : {}),
  }), [tokens]);
  return (
    <div className={streaming ? "agent-chat__markdown agent-chat__markdown--streaming" : "agent-chat__markdown"}>
      <ReactMarkdown remarkPlugins={plugins} components={components}>{children}</ReactMarkdown>
    </div>
  );
}
