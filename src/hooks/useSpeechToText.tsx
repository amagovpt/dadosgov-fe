"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// Tipos para SpeechRecognitionEvent
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Tipos para SpeechRecognitionErrorEvent
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

// Tipos para SpeechRecognition + webkitSpeechRecognition
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onaudioend: ((this: ISpeechRecognition, ev: Event) => unknown) | null;
  onerror:
    | ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown)
    | null;
  onend: ((this: ISpeechRecognition, ev: Event) => unknown) | null;
  onresult:
    | ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => unknown)
    | null;
  onnomatch: ((this: ISpeechRecognition, ev: Event) => unknown) | null;
  onaudiostart: ((this: ISpeechRecognition, ev: Event) => unknown) | null;
  onspeechstart: ((this: ISpeechRecognition, ev: Event) => unknown) | null;
  onspeechend: ((this: ISpeechRecognition, ev: Event) => unknown) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): ISpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): ISpeechRecognition;
    };
  }
}

interface UseSpeechToTextOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  silenceTimeout?: number;
  autoRestart?: boolean;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const {
    lang = "pt",
    continuous = false,
    interimResults = true,
    silenceTimeout = 3000,
    autoRestart = false,
  } = options;

  const [text, setText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [confidence, setConfidence] = useState<number>(0);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManualStopRef = useRef(false);
  const isInitializedRef = useRef(false);
  
  const normalizedLang = {
    pt: "pt-PT",
    en: "en-GB",
  };

  const keyLang = lang as keyof typeof normalizedLang;

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    if (silenceTimeout > 0) {
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening && !isSpeaking) {
          isManualStopRef.current = true;
          recognitionRef.current.stop();
        }
      }, silenceTimeout);
    }
  }, [silenceTimeout, isListening, isSpeaking, clearSilenceTimer]);

  const initializeRecognition = useCallback(() => {
    if (typeof window === 'undefined') {
      setIsSupported(false);
      return null;
    }

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setError("Speech Recognition API is not supported in this browser.");
      setIsSupported(false);
      return null;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = normalizedLang[keyLang] || "pt-PT";

    recognition.onaudiostart = () => {
      setIsActive(true);
      setError(null);
    };

    recognition.onspeechstart = () => {
      setIsSpeaking(true);
      clearSilenceTimer();
    };

    recognition.onspeechend = () => {
      setIsSpeaking(false);
      if (continuous && silenceTimeout > 0) {
        startSilenceTimer();
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";
      let maxConfidence = 0;

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 1;

        if (result.isFinal) {
          finalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setText(prev => prev + finalTranscript);
        setConfidence(maxConfidence);
        setInterimText("");
      } else {
        setInterimText(interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Speech recognition error: ${event.error}`);
      
      const errorMessages: Record<string, string> = {
        'no-speech': 'Nenhuma fala detectada. Tente falar mais alto.',
        'audio-capture': 'Não foi possível capturar áudio. Verifique o microfone.',
        'not-allowed': 'Permissão para usar o microfone foi negada.',
        'network': 'Erro de rede. Verifique sua conexão.',
        'service-not-allowed': 'Serviço de reconhecimento não permitido.',
        'bad-grammar': 'Gramática de reconhecimento inválida.',
        'language-not-supported': 'Idioma não suportado.',
      };

      setError(errorMessages[event.error] || `Erro: ${event.error}`);
      setIsListening(false);
      setIsActive(false);
      setIsSpeaking(false);
      clearSilenceTimer();
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsActive(false);
      setIsSpeaking(false);
      clearSilenceTimer();

      // Auto-restart se configurado e não foi parada manualmente
      if (autoRestart && !isManualStopRef.current) {
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (err) {
              setError(`Error restarting recognition: ${err}`);
            }
          }
        }, 100);
      }
      isManualStopRef.current = false;
    };

    recognition.onnomatch = () => {
      setError("No matching speech recognized");
    };

    return recognition;
  }, [lang, continuous, interimResults, autoRestart, silenceTimeout, startSilenceTimer, clearSilenceTimer, normalizedLang, keyLang]);

  // Inicializar o reconhecimento apenas uma vez
  useEffect(() => {
    if (!isSupported || isInitializedRef.current) return;

    recognitionRef.current = initializeRecognition();
    isInitializedRef.current = true;

    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {
          setError(`Error aborting recognition on unmount: ${err}`);
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError("Speech Recognition API is not supported in this browser.");
      setIsSupported(false);
      return;
    }

    if (isListening) {
      return;
    }

    try {
      setError(null);
      setText("");
      setInterimText("");
      setConfidence(0);
      isManualStopRef.current = false;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      setError(`Error starting recognition: ${err}`);
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    isManualStopRef.current = true;
    clearSilenceTimer();
    
    try {
      recognitionRef.current.stop();
    } catch (err) {
      setError(`Error stopping recognition: ${err}`);
    }
  }, [clearSilenceTimer]);

  const abortListening = useCallback(() => {
    if (!recognitionRef.current) return;

    isManualStopRef.current = true;
    clearSilenceTimer();
    
    try {
      recognitionRef.current.abort();
    } catch (err) {
      setError(`Error aborting recognition: ${err}`);
    }
    
    setIsListening(false);
    setIsActive(false);
    setIsSpeaking(false);
  }, [clearSilenceTimer]);

  const resetText = useCallback(() => {
    setText("");
    setInterimText("");
    setConfidence(0);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estados
    text,
    interimText,
    isListening,
    isActive,
    isSpeaking,
    error,
    isSupported,
    confidence,
    
    // Ações
    startListening,
    stopListening,
    abortListening,
    resetText,
    resetError,
    
    // Informações computadas
    fullText: text + interimText,
    hasText: Boolean(text || interimText),
  };
}