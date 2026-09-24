import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import type { ComposerOption } from "../core/index.js";

type Props = {
  models: ComposerOption[];
  selectedModel?: string;
  setModel: (id: string) => void;
  efforts: ComposerOption[];
  selectedEffort?: string;
  setEffort: (id: string) => void;
  disabled: boolean;
  menuSide: "up" | "down";
};

type PanelView = "settings" | "models";

function shortLabel(option: ComposerOption): string {
  return option.shortLabel
    ?? option.label.replace(/^opencode\s+zen\s*\/\s*/i, "").replace(/^opencode\s*\/\s*/i, "").replace(/^openrouter\s*\/\s*/i, "");
}

function providerMark(option: ComposerOption): string {
  const value = (option.provider ?? "") + " " + option.id + " " + option.label;
  const normalized = value.toLowerCase();
  if (normalized.includes("opencode")) return "OC";
  if (normalized.includes("openrouter")) return "OR";
  if (normalized.includes("grok")) return "G";
  if (normalized.includes("claude") || normalized.includes("anthropic")) return "C";
  if (normalized.includes("codex")) return "✳";
  if (normalized.includes("google") || normalized.includes("antigravity")) return "G";
  return "AI";
}

function ProviderMark({ option }: { option: ComposerOption }) {
  return <i className="agent-chat__provider-mark" aria-hidden="true">{providerMark(option)}</i>;
}

export function ComposerSettingsPicker({ models, selectedModel, setModel, efforts, selectedEffort, setEffort, disabled, menuSide }: Props) {
  const [open, setOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>("settings");
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>();
  const rootRef = useRef<HTMLDivElement>(null);
  const currentModel = models.find((option) => option.id === selectedModel) ?? models[0];
  const currentEffort = efforts.find((option) => option.id === selectedEffort) ?? efforts[0];
  const effortIndex = Math.max(0, efforts.findIndex((option) => option.id === currentEffort?.id));
  const effortProgress = efforts.length > 1 ? (effortIndex / (efforts.length - 1)) * 100 : 100;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setPopoverStyle(undefined);
      return;
    }
    const updatePosition = () => {
      const root = rootRef.current;
      const trigger = root?.querySelector(".agent-chat__settings-trigger");
      if (!root || !trigger) return;
      const triggerRect = trigger.getBoundingClientRect();
      let clipLeft = 12;
      let clipRight = window.innerWidth - 12;
      let ancestor = root.parentElement;
      while (ancestor) {
        const style = getComputedStyle(ancestor);
        if (style.overflowX !== "visible") {
          const rect = ancestor.getBoundingClientRect();
          clipLeft = Math.max(clipLeft, rect.left);
          clipRight = Math.min(clipRight, rect.right);
        }
        ancestor = ancestor.parentElement;
      }
      const width = Math.min(336, Math.max(220, clipRight - clipLeft - 24));
      const left = Math.min(Math.max(triggerRect.right - width, clipLeft + 12), clipRight - width - 12);
      const vertical = menuSide === "up"
        ? { bottom: window.innerHeight - triggerRect.top + 8 }
        : { top: triggerRect.bottom + 8 };
      setPopoverStyle({ position: "fixed", left, width, ...vertical });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, menuSide, panelView]);

  if (!currentModel || !currentEffort) return null;
  const toggle = () => { setOpen((value) => !value); setPanelView("settings"); };
  const popoverClass = ["agent-chat__settings-popover", menuSide === "up" ? "is-up" : "is-down"].join(" ");
  return <div ref={rootRef} className="agent-chat__settings-picker">
    <button type="button" disabled={disabled} aria-haspopup="dialog" aria-expanded={open} aria-label="Choisir le modèle et le niveau d'effort" onClick={toggle} className="agent-chat__settings-trigger">
      <ProviderMark option={currentModel} />
      <span className="agent-chat__settings-model">{shortLabel(currentModel)}</span>
      <span aria-hidden="true" className="agent-chat__settings-separator">·</span>
      <span className="agent-chat__settings-effort">{currentEffort.label}</span>
      <ChevronDown size={16} className="agent-chat__settings-chevron" />
    </button>
    {open && <div role="dialog" aria-label="Réglages du modèle et du raisonnement" className={popoverClass + (popoverStyle ? " is-positioned" : "")} style={popoverStyle}>
      {panelView === "models" ? <div className="agent-chat__settings-models" role="listbox" aria-label="Sélectionner un modèle">
        <button type="button" onClick={() => setPanelView("settings")} className="agent-chat__settings-back"><ChevronLeft size={16} /><span>Modèles</span></button>
        {models.map((option) => <button key={option.id} type="button" role="option" aria-selected={option.id === selectedModel} onClick={() => { setModel(option.id); setOpen(false); }} className={"agent-chat__settings-option" + (option.id === selectedModel ? " is-selected" : "")}>
          <ProviderMark option={option} />
          <span className="agent-chat__settings-option-copy"><strong>{shortLabel(option)}</strong></span>
          {option.id === selectedModel && <Check size={16} />}
        </button>)}
      </div> : <div className="agent-chat__settings-view">
        <button type="button" onClick={() => setPanelView("models")} className="agent-chat__settings-model-row">
          <span><strong><ProviderMark option={currentModel} />{shortLabel(currentModel)}</strong></span>
          <ChevronRight size={16} />
        </button>
        <div className="agent-chat__settings-effort-panel">
          <div className="agent-chat__settings-effort-heading"><span><strong>{currentEffort.label}</strong><ChevronRight size={13} /></span><button type="button" aria-label="Réinitialiser l'effort" onClick={() => setEffort(efforts[Math.floor((efforts.length - 1) / 2)]?.id ?? currentEffort.id)}><RotateCcw size={14} /></button></div>
          <div className="agent-chat__settings-effort-model">{shortLabel(currentModel)}</div>
          <input aria-label="Niveau d'effort" type="range" min="0" max={efforts.length - 1} step="1" value={effortIndex} onChange={(event) => setEffort(efforts[Number(event.currentTarget.value)]?.id ?? currentEffort.id)} style={{ background: "linear-gradient(to right, var(--agent-accent) " + effortProgress + "%, color-mix(in srgb, var(--agent-text) 16%, transparent) " + effortProgress + "%)" }} />
        </div>
      </div>}
    </div>}
  </div>;
}
