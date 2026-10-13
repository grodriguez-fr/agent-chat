import { useMemo, useState, type ReactNode } from "react";
import { ChatIcon } from "./icons.js";
import { groupConversations, type AgentChatController } from "../core/index.js";

export function ConversationSidebar({ controller, brandName, brand, showBrand = true, onNavigate }: { controller: AgentChatController; brandName: string; brand?: ReactNode; showBrand?: boolean; onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const conversations = controller.conversations ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return needle ? conversations.filter((item) => item.title.toLocaleLowerCase().includes(needle)) : conversations;
  }, [conversations, query]);
  const groups = useMemo(() => groupConversations(filtered), [filtered]);

  const save = (id: string) => {
    if (title.trim()) controller.renameConversation?.(id, title.trim());
    setEditing(null);
  };

  return (
    <div className="agent-chat__sidebar-content">
      {showBrand && <div className="agent-chat__sidebar-brand">{brand ?? <span className="agent-chat__brand-mark" aria-hidden>{brandName.slice(0, 1)}</span>}<strong>{brandName}</strong></div>}
      <div className="agent-chat__sidebar-actions">
        {controller.newConversation && <button type="button" onClick={() => { controller.newConversation?.(); onNavigate?.(); }}><ChatIcon name="add" size={16} />Nouvelle conversation</button>}
        <label className="agent-chat__search"><ChatIcon name="search" size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher…" aria-label="Rechercher une conversation" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Effacer"><ChatIcon name="close" size={13} /></button>}</label>
      </div>
      <div className="agent-chat__conversation-scroll">
        {groups.map((group) => (
          <section key={group.label} className="agent-chat__conversation-group" aria-label={group.label}>
            <p>{group.label}</p>
            {group.items.map((conversation) => (
              <div key={conversation.id} className={`agent-chat__conversation${controller.activeConversationId === conversation.id ? " is-active" : ""}`}>
                {editing === conversation.id ? <>
                  <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") save(conversation.id); if (event.key === "Escape") setEditing(null); }} />
                  <button type="button" onClick={() => save(conversation.id)} aria-label="Enregistrer"><ChatIcon name="check" size={13} /></button>
                </> : <button type="button" className="agent-chat__conversation-title" title={conversation.title} onClick={() => { controller.selectConversation?.(conversation.id); onNavigate?.(); }}>{conversation.title}</button>}
                {conversation.busy && <span className={`agent-chat__busy agent-chat__busy--${conversation.busy}`} title="Conversation en cours" />}
                <div className="agent-chat__conversation-actions">
                  {controller.pinConversation && <button type="button" onClick={() => controller.pinConversation?.(conversation.id, !conversation.pinned)} aria-label={conversation.pinned ? "Désépingler" : "Épingler"}>{conversation.pinned ? <ChatIcon name="unpin" size={13} /> : <ChatIcon name="pin" size={13} />}</button>}
                  {controller.renameConversation && <button type="button" onClick={() => { setEditing(conversation.id); setTitle(conversation.title); }} aria-label="Renommer"><ChatIcon name="edit" size={13} /></button>}
                  {controller.deleteConversation && <button type="button" onClick={() => controller.deleteConversation?.(conversation.id)} aria-label="Supprimer"><ChatIcon name="delete" size={13} /></button>}
                </div>
              </div>
            ))}
          </section>
        ))}
        {conversations.length === 0 && <p className="agent-chat__empty-list">Aucune conversation.</p>}
        {conversations.length > 0 && filtered.length === 0 && <p className="agent-chat__empty-list">Aucun résultat.</p>}
      </div>
    </div>
  );
}
