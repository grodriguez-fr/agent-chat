import { useEffect, useRef, useState, type KeyboardEventHandler } from "react";
import { ArrowUp, LoaderCircle, Mic, Paperclip, Square } from "lucide-react";
import type { AgentChatController, AgentChatSlots } from "../core/index.js";
import { ComposerQueue } from "./ComposerQueue.js";
import { useDictation } from "./useDictation.js";
import { ComposerSettingsPicker } from "./ComposerSettingsPicker.js";

export type AgentComposerProps = {
  controller: AgentChatController;
  slots?: AgentChatSlots;
  placeholder?: string;
  settingsMenuSide?: "up" | "down";
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
};

export function AgentComposer({ controller, slots, placeholder = "Demande à l’agent…", settingsMenuSide = "up", onKeyDown }: AgentComposerProps) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  const latestInput = useRef(controller.input);
  latestInput.current = controller.input;
  const [submitting, setSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const voice = useDictation(controller.input, controller.setInput);
  const busy = controller.status === "streaming" || controller.status === "connecting";
  const canSend = (Boolean(controller.input.trim()) || controller.hasAttachments) && !controller.disabled && !controller.sendingDisabled && !submitting && (!busy || controller.allowQueue);
  useEffect(() => {
    const node = textarea.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, [controller.input]);
  const send = async () => {
    if (!canSend || pending.current) return;
    const draft = controller.input;
    pending.current = true; setSubmitting(true); setSendError(null);
    try {
      const accepted = await controller.send(draft.trim());
      if (accepted !== false && latestInput.current === draft) controller.setInput("");
    } catch { setSendError("Message non envoyé. Ton brouillon est conservé."); }
    finally { pending.current = false; setSubmitting(false); }
  };
  return <div className="agent-chat__composer-wrap">
    <div className="agent-chat__composer" data-disabled={controller.disabled || undefined}>
      <ComposerQueue controller={controller} />{slots?.composerBefore}
      <textarea ref={textarea} aria-label="Message à l’agent" value={controller.input} onChange={(event) => controller.setInput(event.target.value)} placeholder={controller.disabled ? controller.disabledReason ?? placeholder : placeholder} disabled={controller.disabled} rows={1} onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        onKeyDown?.(event);
        if (!event.defaultPrevented && event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); }
      }} />
      <div className="agent-chat__composer-toolbar">
        <div className="agent-chat__composer-leading">{slots?.composerLeading}
          {controller.attach && <><input ref={fileInput} hidden type="file" multiple onChange={(event) => { controller.attach?.(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><button type="button" disabled={controller.disabled || controller.sendingDisabled} onClick={() => fileInput.current?.click()} aria-label="Joindre"><Paperclip size={15} /></button></>}
          {controller.models && controller.setModel && controller.efforts && controller.setEffort && <ComposerSettingsPicker models={controller.models} selectedModel={controller.selectedModel} setModel={controller.setModel} efforts={controller.efforts} selectedEffort={controller.selectedEffort} setEffort={controller.setEffort} disabled={Boolean(controller.disabled)} menuSide={settingsMenuSide} />}
        </div>
        <div className="agent-chat__composer-trailing">{slots?.composerTrailing}
          {slots?.voiceControl !== undefined ? slots.voiceControl : voice.supported && <button type="button" disabled={controller.disabled} onClick={voice.toggle} className={voice.listening ? "is-active" : ""} aria-pressed={voice.listening} aria-label={voice.listening ? "Arrêter la dictée" : "Dicter un message"}><Mic size={15} /></button>}
          {controller.status === "streaming" && controller.stop && <button type="button" className="agent-chat__stop" onClick={controller.stop} aria-label="Interrompre la réponse"><Square size={13} fill="currentColor" /></button>}
          <button type="button" className="agent-chat__send" onClick={() => void send()} disabled={!canSend} aria-busy={submitting || controller.status === "connecting"} aria-label={controller.status === "streaming" && controller.allowQueue ? "Mettre en file" : "Envoyer"}>{submitting || controller.status === "connecting" ? <LoaderCircle size={16} className="is-spinning" /> : <ArrowUp size={16} strokeWidth={2.5} />}</button>
        </div>
      </div>
    </div>
    {(sendError || voice.error) && <p className="agent-chat__composer-error" role="alert">{sendError || voice.error}</p>}
  </div>;
}
