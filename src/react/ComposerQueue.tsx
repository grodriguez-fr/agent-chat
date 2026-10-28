import { useState } from "react";
import { ChatIcon } from "./icons.js";
import type { AgentChatController } from "../core/index.js";

/** Messages waiting for the end of the turn, in a tray attached above the composer. */
export function ComposerQueue({ controller }: { controller: AgentChatController }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const save = (id: string) => {
    if (!draft.trim()) return;
    controller.editQueued?.(id, draft.trim()); setEditing(null);
  };
  const queue = controller.queue ?? [];
  if (!queue.length) return null;
  const label = queue.length === 1 ? "1 message en attente" : `${queue.length} messages en attente`;
  return <section className="agent-chat__queue" aria-label={label}>
    <ol className="agent-chat__queue-list">{queue.map((item) => <li key={item.id} className="agent-chat__queue-row" data-editing={editing === item.id || undefined}>
      <ChatIcon name="queued" size={14} />
      {editing === item.id ? <input autoFocus aria-label="Modifier le message en attente" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Enter") { event.preventDefault(); save(item.id); }
        if (event.key === "Escape") setEditing(null);
      }} /> : <span className="agent-chat__queue-text" title={item.text}>{item.text}</span>}
      <div className="agent-chat__queue-actions">
        {controller.editQueued && <button type="button" onClick={() => {
          if (editing === item.id) save(item.id); else { setEditing(item.id); setDraft(item.text); }
        }} aria-label={editing === item.id ? "Enregistrer" : "Modifier"} title={editing === item.id ? "Enregistrer" : "Modifier"}>{editing === item.id ? <ChatIcon name="check" size={14} /> : <ChatIcon name="edit" size={14} />}</button>}
        {controller.sendQueued && editing !== item.id && <button type="button" className="agent-chat__queue-send" onClick={() => controller.sendQueued?.(item.id)} aria-label="Envoyer maintenant" title="Envoyer maintenant"><ChatIcon name="arrow-up" size={14} /></button>}
        {controller.cancelQueued && <button type="button" onClick={() => controller.cancelQueued?.(item.id)} aria-label="Retirer" title="Retirer de la file"><ChatIcon name="close" size={14} /></button>}
      </div>
    </li>)}</ol>
  </section>;
}
