/** Adapt the shared HTTP event contract to the existing ACP browser transport. */
export function agentEventToAcpUpdate(event, seenTools) {
    if (event.type === "text" || event.type === "reasoning")
        return {
            sessionUpdate: event.type === "text" ? "agent_message_chunk" : "agent_thought_chunk",
            content: { type: "text", text: event.text },
        };
    if (event.type === "plan")
        return { sessionUpdate: "plan", entries: event.entries };
    if (event.type === "usage")
        return { sessionUpdate: "usage", estimatedCostUsd: event.estimatedCostUsd };
    if (event.type !== "tool")
        return null;
    const first = !seenTools.has(event.tool.id);
    seenTools.add(event.tool.id);
    const { id, ...metadata } = event.tool;
    const output = event.tool.output ?? event.tool.detail;
    return {
        sessionUpdate: first ? "tool_call" : "tool_call_update",
        toolCallId: id, ...metadata,
        ...(output ? { content: [{ type: "text", text: output }] } : {}),
    };
}
//# sourceMappingURL=acp-updates.js.map