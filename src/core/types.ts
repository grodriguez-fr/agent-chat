import type { ReactNode } from "react";

export type AgentStatus = "idle" | "connecting" | "ready" | "streaming" | "error";
export type AgentRole = "user" | "assistant" | "system" | "tool";
export type ToolStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export type AgentToolDiff = {
  path: string;
  oldText?: string;
  newText?: string;
  added?: number;
  removed?: number;
};

export type AgentToolActivity = {
  id: string;
  title: string;
  status: ToolStatus;
  kind?: string;
  detail?: string;
  command?: string;
  output?: string;
  path?: string;
  diffs?: AgentToolDiff[];
  startedAt?: number;
  endedAt?: number;
};

export type AgentAttachment = {
  id: string;
  name: string;
  url: string;
  contentType?: string;
};

export type AgentMessagePart =
  | { type: "text"; text: string; streaming?: boolean }
  | { type: "reasoning"; text: string; streaming?: boolean }
  | { type: "tool"; tool: AgentToolActivity }
  | { type: "attachment"; attachment: AgentAttachment }
  | { type: "slot"; id: string; value?: unknown };

export type AgentMessage = {
  id: string;
  role: AgentRole;
  parts: AgentMessagePart[];
  createdAt?: number;
  endedAt?: number;
  queued?: boolean;
};

export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  busy?: "local" | "remote";
};

export type ComposerOption = { id: string; label: string; description?: string };
export type QueuedPrompt = { id: string; text: string };

export type AgentChatController = {
  status: AgentStatus;
  messages: AgentMessage[];
  input: string;
  setInput: (value: string) => void;
  send: (value: string) => void;
  stop?: () => void;
  error?: string | null;
  streamStartedAt?: number | null;
  disabled?: boolean;
  disabledReason?: string;
  conversations?: ConversationSummary[];
  activeConversationId?: string | null;
  activeConversationTitle?: string;
  selectConversation?: (id: string) => void;
  newConversation?: () => void;
  deleteConversation?: (id: string) => void;
  renameConversation?: (id: string, title: string) => void;
  pinConversation?: (id: string, pinned: boolean) => void;
  queue?: QueuedPrompt[];
  cancelQueued?: (id: string) => void;
  editQueued?: (id: string, text: string) => void;
  sendQueued?: (id: string) => void;
  models?: ComposerOption[];
  selectedModel?: string;
  setModel?: (id: string) => void;
  efforts?: ComposerOption[];
  selectedEffort?: string;
  setEffort?: (id: string) => void;
  attach?: (files: File[]) => void;
  retryMessage?: (id: string) => void;
  editMessage?: (id: string, text: string) => void;
};

export type AgentChatSlots = {
  brand?: ReactNode;
  headerTrailing?: ReactNode;
  emptyBefore?: ReactNode;
  emptyAfter?: ReactNode;
  composerLeading?: ReactNode;
  composerTrailing?: ReactNode;
  afterMessages?: ReactNode;
  renderMarkdown?: (markdown: string, streaming: boolean) => ReactNode;
  renderToolDetail?: (tool: AgentToolActivity) => ReactNode;
  renderMessageSlot?: (id: string, value: unknown) => ReactNode;
  renderMessageActions?: (message: AgentMessage) => ReactNode;
};
