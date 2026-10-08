import type { ComposerTrigger, InlineToken } from "./types.js";
export type TriggerMatch = {
    trigger: ComposerTrigger;
    /** Text typed after the trigger character, up to the caret. */
    query: string;
    /** Index of the trigger character in the input. */
    start: number;
    /** Caret index (end of the query). */
    end: number;
};
/**
 * Find the trigger being typed at the caret: the trigger character must start
 * the input or follow whitespace, and the query cannot contain whitespace.
 */
export declare function findTriggerMatch(text: string, caret: number, triggers: readonly ComposerTrigger[]): TriggerMatch | null;
/**
 * Replace the typed trigger and query with `insert`. A space is added after the
 * insertion unless `insert` already ends with whitespace or whitespace follows.
 */
export declare function applySuggestion(text: string, match: Pick<TriggerMatch, "start" | "end">, insert: string): {
    value: string;
    caret: number;
};
export type InlineSegment = {
    type: "text";
    text: string;
} | {
    type: "token";
    text: string;
    tokenIndex: number;
};
/** Re-run a token pattern on its own match to obtain capture groups. */
export declare function execInlineToken(token: Pick<InlineToken, "pattern">, text: string): RegExpExecArray | null;
/** Split plain text into text and token segments; earliest match wins, then the first token. */
export declare function splitInlineTokens(text: string, tokens: readonly Pick<InlineToken, "pattern">[]): InlineSegment[];
//# sourceMappingURL=composer.d.ts.map