import { type InlineToken } from "../core/index.js";
/** Plain text with inline tokens, used for user messages. */
export declare function AgentInlineText({ text, tokens }: {
    text: string;
    tokens?: readonly InlineToken[];
}): import("react").JSX.Element;
export declare function AgentMarkdown({ children, streaming, tokens }: {
    children: string;
    streaming?: boolean;
    tokens?: readonly InlineToken[];
}): import("react").JSX.Element;
//# sourceMappingURL=Markdown.d.ts.map