import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AgentMarkdown({ children, streaming = false }: { children: string; streaming?: boolean }) {
  return (
    <div className={streaming ? "agent-chat__markdown agent-chat__markdown--streaming" : "agent-chat__markdown"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
