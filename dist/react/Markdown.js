import { jsx as _jsx } from "react/jsx-runtime";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
export function AgentMarkdown({ children, streaming = false }) {
    return (_jsx("div", { className: streaming ? "agent-chat__markdown agent-chat__markdown--streaming" : "agent-chat__markdown", children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: children }) }));
}
//# sourceMappingURL=Markdown.js.map