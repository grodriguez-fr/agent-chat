# @grodriguez-fr/agent-chat

Shared agent-chat UI and client primitives used by Talos, LOGOS and job-finder.

```tsx
import "@grodriguez-fr/agent-chat/styles.css";
import { AgentChatShell } from "@grodriguez-fr/agent-chat/react";

<AgentChatShell
  variant="page"
  brandName="Talos"
  controller={controller}
/>
```

## Exports

- `core`: normalized messages, tools, conversations and timeline helpers.
- `react`: page/panel shell, conversation navigation, timeline and composer.
- `client`: reconnecting WebSocket client and ACP/AI SDK protocol parsers.
- `styles.css`: framework-independent styles driven by `--agent-*` variables.

Application-specific behavior is supplied through an `AgentChatController` and
optional slots. Server APIs, persistence, permissions and product entities stay
inside each consumer.
