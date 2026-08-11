import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, Maximize2, Menu, Plus, X } from "lucide-react";
import type { AgentChatController, AgentChatSlots } from "../core/index.js";
import { AgentComposer } from "./Composer.js";
import { ConversationSidebar } from "./ConversationSidebar.js";
import { AgentTimeline } from "./Timeline.js";

export type AgentChatShellProps = {
  variant: "page" | "panel";
  controller: AgentChatController;
  brandName: string;
  slots?: AgentChatSlots;
  suggestions?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
  placeholder?: string;
  className?: string;
  open?: boolean;
  onClose?: () => void;
  onExpand?: () => void;
  panelWidth?: string;
};

export function AgentChatShell({ variant, controller, brandName, slots, suggestions = [], emptyTitle = "Comment puis-je t’aider ?", emptyDescription, placeholder, className = "", open = true, onClose, onExpand, panelWidth }: AgentChatShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const hasConversations = Boolean(controller.conversations && controller.selectConversation);
  const isEmpty = controller.messages.length === 0;

  useEffect(() => {
    const node = scroll.current;
    if (!node || showJump) return;
    node.scrollTo({ top: node.scrollHeight, behavior: controller.status === "streaming" ? "auto" : "smooth" });
  }, [controller.messages, controller.status, showJump]);

  if (variant === "panel" && !open) return null;
  const style = panelWidth ? ({ "--agent-panel-width": panelWidth } as CSSProperties) : undefined;
  return <div className={`agent-chat agent-chat--${variant} ${className}`} style={style}>
    {variant === "page" && hasConversations && <aside className="agent-chat__sidebar"><ConversationSidebar controller={controller} brandName={brandName} /></aside>}
    <div className="agent-chat__main">
      <header className="agent-chat__topbar">
        {hasConversations && <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Conversations" className={variant === "page" ? "agent-chat__mobile-only" : ""}><Menu size={19} /></button>}
        <div className="agent-chat__brand">{slots?.brand ?? <span className="agent-chat__brand-mark" aria-hidden>{brandName.slice(0, 1)}</span>}<span>{controller.activeConversationTitle || brandName}</span></div>
        <div className="agent-chat__header-status">{controller.status !== "ready" && controller.status !== "idle" ? controller.status === "streaming" ? "En cours…" : controller.status === "connecting" ? "Connexion…" : controller.status === "error" ? "Erreur" : "" : ""}</div>
        {slots?.headerTrailing}
        {controller.newConversation && <button type="button" onClick={controller.newConversation} aria-label="Nouvelle conversation"><Plus size={18} /></button>}
        {onExpand && <button type="button" onClick={onExpand} aria-label="Ouvrir en plein écran"><Maximize2 size={17} /></button>}
        {onClose && <button type="button" onClick={onClose} aria-label="Fermer"><X size={18} /></button>}
      </header>
      <div className="agent-chat__content">
        {isEmpty ? <div className="agent-chat__empty">{slots?.emptyBefore}<div className="agent-chat__empty-mark">{slots?.brand ?? brandName.slice(0, 1)}</div><h2>{emptyTitle}</h2>{emptyDescription && <p>{emptyDescription}</p>}{suggestions.length > 0 && <div className="agent-chat__suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => { controller.setInput(suggestion); controller.send(suggestion); }}>{suggestion}</button>)}</div>}{slots?.emptyAfter}<AgentComposer controller={controller} slots={slots} placeholder={placeholder} /></div> : <><div ref={scroll} className="agent-chat__scroll" onScroll={(event) => { const node = event.currentTarget; setShowJump(node.scrollHeight - node.scrollTop - node.clientHeight > 120); }}><AgentTimeline controller={controller} slots={slots} /></div>{showJump && <button type="button" className="agent-chat__jump" onClick={() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "smooth" }); setShowJump(false); }}><ChevronDown size={15} />Bas de la conversation</button>}<footer className="agent-chat__footer"><AgentComposer controller={controller} slots={slots} placeholder={placeholder} /></footer></>}
        {controller.error && <div className="agent-chat__error" role="alert">{controller.error}</div>}
      </div>
    </div>
    {drawerOpen && hasConversations && <div className="agent-chat__drawer"><button type="button" className="agent-chat__scrim" onClick={() => setDrawerOpen(false)} aria-label="Fermer les conversations" /><aside><ConversationSidebar controller={controller} brandName={brandName} onNavigate={() => setDrawerOpen(false)} /></aside></div>}
  </div>;
}
