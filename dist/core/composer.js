/**
 * Find the trigger being typed at the caret: the trigger character must start
 * the input or follow whitespace, and the query cannot contain whitespace.
 */
export function findTriggerMatch(text, caret, triggers) {
    if (!triggers.length || caret < 0 || caret > text.length)
        return null;
    const before = text.slice(0, caret);
    const word = before.match(/(?:^|\s)(\S*)$/)?.[1] ?? "";
    if (!word)
        return null;
    const trigger = triggers.find((candidate) => candidate.char && word.startsWith(candidate.char));
    if (!trigger)
        return null;
    const query = word.slice(trigger.char.length);
    if (query.includes(trigger.char))
        return null;
    return { trigger, query, start: caret - word.length, end: caret };
}
/**
 * Replace the typed trigger and query with `insert`. A space is added after the
 * insertion unless `insert` already ends with whitespace or whitespace follows.
 */
export function applySuggestion(text, match, insert) {
    const after = text.slice(match.end);
    const endsWithSpace = /\s$/.test(insert);
    const spaceFollows = /^\s/.test(after);
    const inserted = endsWithSpace || spaceFollows ? insert : `${insert} `;
    // Place the caret after the separating whitespace, whether added or existing.
    const caret = match.start + inserted.length + (!endsWithSpace && spaceFollows ? 1 : 0);
    return { value: text.slice(0, match.start) + inserted + after, caret };
}
function globalPattern(pattern) {
    return new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
}
/** Re-run a token pattern on its own match to obtain capture groups. */
export function execInlineToken(token, text) {
    return new RegExp(token.pattern.source, token.pattern.flags.replace(/[gy]/g, "")).exec(text);
}
/** Split plain text into text and token segments; earliest match wins, then the first token. */
export function splitInlineTokens(text, tokens) {
    if (!tokens.length || !text)
        return text ? [{ type: "text", text }] : [];
    const segments = [];
    const patterns = tokens.map((token) => globalPattern(token.pattern));
    let position = 0;
    while (position < text.length) {
        let best = null;
        patterns.forEach((pattern, tokenIndex) => {
            pattern.lastIndex = position;
            const match = pattern.exec(text);
            if (match && match[0] && (!best || match.index < best.index))
                best = { index: match.index, text: match[0], tokenIndex };
        });
        const found = best;
        if (!found)
            break;
        if (found.index > position)
            segments.push({ type: "text", text: text.slice(position, found.index) });
        segments.push({ type: "token", text: found.text, tokenIndex: found.tokenIndex });
        position = found.index + found.text.length;
    }
    if (position < text.length)
        segments.push({ type: "text", text: text.slice(position) });
    return segments;
}
//# sourceMappingURL=composer.js.map