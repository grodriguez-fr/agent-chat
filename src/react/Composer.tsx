import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Mic, Paperclip, Pencil, Square, X } from "lucide-react";
import type { AgentChatController, AgentChatSlots } from "../core/index.js";

type SpeechRecognitionCtor = new () => { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null };

export function AgentComposer({ controller, slots, placeholder = "Demande à l’agent…" }: { controller: AgentChatController; slots?: AgentChatSlots; placeholder?: string }) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const recognition = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const [listening, setListening] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const canSend = Boolean(controller.input.trim()) && !controller.disabled;

  useEffect(() => {
    if (!textarea.current) return;
    textarea.current.style.height = "auto";
    textarea.current.style.height = `${Math.min(textarea.current.scrollHeight, 160)}px`;
  }, [controller.input]);

  const send = () => {
    const value = controller.input.trim();
    if (!value || controller.disabled) return;
    controller.send(value);
    controller.setInput("");
  };

  const toggleVoice = () => {
    const scope = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const Ctor = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
    if (!Ctor) return;
    if (listening) { recognition.current?.stop(); return; }
    const instance = new Ctor();
    recognition.current = instance;
    instance.lang = "fr-FR";
    instance.continuous = false;
    instance.interimResults = false;
    instance.onresult = (event) => controller.setInput(`${controller.input}${controller.input ? " " : ""}${event.results[0]?.[0]?.transcript ?? ""}`);
    instance.onend = () => setListening(false);
    setListening(true);
    instance.start();
  };

  return (
    <div className="agent-chat__composer-wrap">
      {(controller.queue?.length ?? 0) > 0 && <div className="agent-chat__queue">{controller.queue?.map((item) => <div key={item.id} className="agent-chat__queue-row">{editing === item.id ? <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && draft.trim()) { controller.editQueued?.(item.id, draft.trim()); setEditing(null); } }} /> : <span title={item.text}>{item.text}</span>}<div>{controller.editQueued && <button type="button" onClick={() => { if (editing === item.id && draft.trim()) { controller.editQueued?.(item.id, draft.trim()); setEditing(null); } else { setEditing(item.id); setDraft(item.text); } }} aria-label="Modifier">{editing === item.id ? <Check size={13} /> : <Pencil size={13} />}</button>}{controller.sendQueued && <button type="button" onClick={() => controller.sendQueued?.(item.id)} aria-label="Envoyer maintenant"><ArrowUp size={13} /></button>}{controller.cancelQueued && <button type="button" onClick={() => controller.cancelQueued?.(item.id)} aria-label="Retirer"><X size={13} /></button>}</div></div>)}</div>}
      <div className="agent-chat__composer">
        <textarea ref={textarea} value={controller.input} onChange={(event) => controller.setInput(event.target.value)} placeholder={controller.disabled ? controller.disabledReason : placeholder} disabled={controller.disabled} rows={1} onKeyDown={(event) => { if (event.nativeEvent.isComposing) return; if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} />
        <div className="agent-chat__composer-toolbar">
          <div className="agent-chat__composer-leading">{slots?.composerLeading}{controller.models && controller.setModel && <select value={controller.selectedModel} onChange={(event) => controller.setModel?.(event.target.value)} aria-label="Modèle">{controller.models.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>}{controller.efforts && controller.setEffort && <select value={controller.selectedEffort} onChange={(event) => controller.setEffort?.(event.target.value)} aria-label="Effort">{controller.efforts.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>}</div>
          <div className="agent-chat__composer-trailing">{slots?.composerTrailing}{controller.attach && <><input ref={fileInput} hidden type="file" multiple onChange={(event) => { controller.attach?.(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><button type="button" onClick={() => fileInput.current?.click()} aria-label="Joindre"><Paperclip size={17} /></button></>}<button type="button" onClick={toggleVoice} className={listening ? "is-active" : ""} aria-label={listening ? "Arrêter la dictée" : "Dicter"}><Mic size={17} /></button>{controller.status === "streaming" && controller.stop && <button type="button" className="agent-chat__stop" onClick={controller.stop} aria-label="Arrêter"><Square size={13} fill="currentColor" /></button>}<button type="button" className="agent-chat__send" onClick={send} disabled={!canSend} aria-label={controller.status === "streaming" ? "Mettre en file" : "Envoyer"}><ArrowUp size={17} /></button></div>
        </div>
      </div>
    </div>
  );
}
