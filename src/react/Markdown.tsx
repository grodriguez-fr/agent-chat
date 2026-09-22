import { isValidElement, useState, type ReactNode } from "react";
import { Check, Copy, WrapText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

export function AgentMarkdown({ children, streaming = false }: { children: string; streaming?: boolean }) {
  return (
    <div className={streaming ? "agent-chat__markdown agent-chat__markdown--streaming" : "agent-chat__markdown"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: CodeBlock }}>{children}</ReactMarkdown>
    </div>
  );
}
