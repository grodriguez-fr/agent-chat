import { useEffect, useRef, useState } from "react";

type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor() {
  const scope = window as typeof window & { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

export function useDictation(input: string, setInput: (value: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const current = useRef({ input, setInput });
  current.current = { input, setInput };
  useEffect(() => {
    setSupported(Boolean(recognitionCtor()));
    return () => {
      const instance = recognition.current;
      if (instance) { instance.onend = null; instance.onerror = null; instance.onresult = null; instance.abort(); }
    };
  }, []);
  const toggle = () => {
    if (listening) { recognition.current?.stop(); return; }
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const instance = new Ctor();
    recognition.current = instance;
    instance.lang = "fr-FR";
    instance.continuous = false;
    instance.interimResults = false;
    instance.onresult = (event) => {
      const { input: value, setInput: update } = current.current;
      update(`${value}${value ? " " : ""}${event.results[0]?.[0]?.transcript ?? ""}`);
    };
    instance.onend = () => setListening(false);
    instance.onerror = () => { setListening(false); setError("Dictée indisponible. Vérifie l’accès au microphone."); };
    try { setError(null); instance.start(); setListening(true); }
    catch { setListening(false); setError("Impossible de démarrer la dictée."); }
  };
  return { supported, listening, error, toggle };
}
