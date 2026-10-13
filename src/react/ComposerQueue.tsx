import { useState } from "react";
import { ChatIcon } from "./icons.js";
import type { AgentChatController } from "../core/index.js";

export function ComposerQueue({ controller }: { controller: AgentChatController }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const save = (id: string) => {
    if (!draft.trim()) return;
    controller.editQueued?.(id, draft.trim()); setEditing(null);
  };
  if (!controller.queue?.length) return null;
  return <div className="agent-chat__queue">{controller.queue.map((item) => <div key={item.id} className="agent-chat__queue-row">
    <ChatIcon name="queued" size={13} />
    {editing === item.id ? <input autoFocus aria-label="Modifier le message en attente" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
      if (event.nativeEvent.isComposing) return;
      if (event.key === "Enter") { event.preventDefault(); save(item.id); }
      if (event.key === "Escape") setEditing(null);
    }} /> : <span title={item.text}>{item.text}</span>}
    <div>{controller.editQueued && <button type="button" onClick={() => {
      if (editing === item.id) save(item.id); else { setEditing(item.id); setDraft(item.text); }
    }} aria-label={editing === item.id ? "Enregistrer" : "Modifier"}>{editing === item.id ? <ChatIcon name="check" size={13} /> : <ChatIcon name="edit" size={13} />}</button>}
    {controller.sendQueued && <button type="button" onClick={() => controller.sendQueued?.(item.id)} aria-label="Envoyer maintenant"><ChatIcon name="arrow-up" size={13} /></button>}
    {controller.cancelQueued && <button type="button" onClick={() => controller.cancelQueued?.(item.id)} aria-label="Retirer"><ChatIcon name="close" size={13} /></button>}</div>
  </div>)}</div>;
}
