export function normalizeToolStatus(status) {
    const value = status?.toLowerCase();
    if (["completed", "complete", "success", "succeeded", "done", "ok"].includes(value ?? ""))
        return "completed";
    if (["failed", "error", "timeout"].includes(value ?? ""))
        return "failed";
    if (["cancelled", "canceled"].includes(value ?? ""))
        return "cancelled";
    if (["running", "in_progress", "started"].includes(value ?? ""))
        return "running";
    return "pending";
}
export function messageText(message) {
    return message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
}
export function messageTools(message) {
    return message.parts.filter((part) => part.type === "tool").map((part) => part.tool);
}
export function buildThreadBlocks(messages, streaming) {
    const visible = messages.filter((message) => !message.queued);
    const blocks = [];
    let index = 0;
    while (index < visible.length) {
        const message = visible[index];
        if (message.role !== "user") {
            blocks.push({ type: "message", message });
            index += 1;
            continue;
        }
        blocks.push({ type: "message", message });
        const start = index + 1;
        let end = start;
        while (end < visible.length && visible[end].role !== "user")
            end += 1;
        const turn = visible.slice(start, end);
        const live = streaming && end === visible.length;
        let finalMessage;
        let activity = turn;
        if (!live) {
            const candidate = [...turn].reverse().find((entry) => entry.role === "assistant" && messageText(entry).trim());
            if (candidate) {
                const finalParts = candidate.parts.filter((part) => part.type === "text" || part.type === "attachment" || part.type === "slot");
                const activityParts = candidate.parts.filter((part) => part.type === "tool" || part.type === "reasoning");
                finalMessage = { ...candidate, parts: finalParts };
                activity = turn.filter((entry) => entry !== candidate);
                if (activityParts.length)
                    activity = [...activity, { ...candidate, id: `${candidate.id}-activity`, parts: activityParts }];
            }
        }
        const endedAt = [...turn].reverse().find((entry) => entry.endedAt || entry.createdAt)?.endedAt ?? [...turn].reverse().find((entry) => entry.createdAt)?.createdAt;
        const durationMs = message.createdAt && endedAt && endedAt >= message.createdAt ? endedAt - message.createdAt : null;
        if (activity.length || finalMessage || live)
            blocks.push({ type: "execution", id: `execution-${message.id}`, messages: activity, finalMessage, live, durationMs });
        index = end;
    }
    return blocks;
}
export function groupConversations(conversations, now = new Date()) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const boundaries = [
        { label: "Aujourd’hui", min: today },
        { label: "Hier", min: today - 86_400_000 },
        { label: "7 derniers jours", min: today - 7 * 86_400_000 },
        { label: "Plus ancien", min: Number.NEGATIVE_INFINITY },
    ];
    return boundaries.map(({ label, min }, index) => ({
        label,
        items: conversations.filter((conversation) => conversation.updatedAt >= min && (index === 0 || conversation.updatedAt < boundaries[index - 1].min)),
    })).filter((group) => group.items.length > 0);
}
export function formatDuration(milliseconds) {
    const seconds = Math.max(0, Math.round(milliseconds / 1000));
    if (seconds < 60)
        return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`;
}
//# sourceMappingURL=timeline.js.map