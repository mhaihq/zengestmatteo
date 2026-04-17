import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  it: 'it-IT',
};

function getSpeechLang(i18nLang: string): string {
  return LANG_MAP[i18nLang] || i18nLang;
}

function getSpeechRecognitionClass() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeechToText(language: string) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const restartingRef = useRef(false);

  useEffect(() => {
    setSupported(!!getSpeechRecognitionClass());
  }, []);

  const stop = useCallback(() => {
    restartingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SRClass = getSpeechRecognitionClass();
    if (!SRClass) return;

    stop();

    const recognition = new SRClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getSpeechLang(language);
    recognitionRef.current = recognition;

    let finalTranscript = '';

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      stop();
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        restartingRef.current = true;
        try {
          recognition.start();
        } catch {
          stop();
        }
      }
    };

    try {
      recognition.start();
    } catch {
      stop();
    }
  }, [language, stop]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    listening,
    transcript,
    supported,
    start,
    stop,
    resetTranscript,
  };
}
