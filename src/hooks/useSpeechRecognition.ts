import { useCallback, useEffect, useRef, useState } from "react";

export interface UseSpeechRecognitionOptions {
  /** BCP-47 language tag for recognition. Defaults to "en-US". */
  lang?: string;
  /**
   * Called as speech is transcribed. `isFinal` is true for a settled result
   * and false for a live interim guess.
   */
  onResult?: (text: string, isFinal: boolean) => void;
}

export interface UseSpeechRecognitionResult {
  /** Whether the browser exposes the Web Speech recognition API. */
  isSupported: boolean;
  /** Whether recognition is currently capturing audio. */
  isListening: boolean;
  /** A friendly error message, or null when there is none. */
  error: string | null;
  /** Begin listening (no-op with an error set when unsupported). */
  start: () => void;
  /** Stop listening. */
  stop: () => void;
}

/** Resolve the SpeechRecognition constructor, guarding SSR. */
function getRecognitionCtor(): SpeechRecognitionStatic | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

/**
 * Reusable speech-to-text hook built on the browser's Web Speech API.
 *
 * Provides supported/listening state, a friendly `error` message, and
 * `start`/`stop` controls. Interim and final transcripts are delivered through
 * {@link UseSpeechRecognitionOptions.onResult}. The active recognition instance
 * is cleaned up on unmount so no listeners leak.
 */
export function useSpeechRecognition(
  options?: UseSpeechRecognitionOptions,
): UseSpeechRecognitionResult {
  const Ctor = getRecognitionCtor();
  const isSupported = typeof window !== "undefined" && !!Ctor;

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Keep the latest options in a ref so handlers always see current callbacks
  // without needing to re-create the recognition instance.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const detachHandlers = useCallback((recognition: SpeechRecognition) => {
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    if (!isSupported || !Ctor) {
      setError(
        "Voice input is not supported in this browser. Please use Chrome or Edge.",
      );
      return;
    }

    // Tear down any existing instance before starting a fresh one.
    const existing = recognitionRef.current;
    if (existing) {
      detachHandlers(existing);
      existing.abort();
    }

    const recognition = new Ctor();
    recognition.lang = optionsRef.current?.lang ?? "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    setError(null);

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      const onResult = optionsRef.current?.onResult;
      if (!onResult) {
        return;
      }
      if (final) {
        onResult(final.trim(), true);
      }
      if (interim) {
        onResult(interim, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let message: string | null;
      switch (event.error) {
        case "not-allowed":
        case "service-not-allowed":
          message =
            "Microphone permission was denied. Please allow microphone access and try again.";
          break;
        case "no-speech":
          message = "No speech was detected. Please try again.";
          break;
        case "audio-capture":
          message = "No microphone was found or it is unavailable.";
          break;
        case "aborted":
          message = null;
          break;
        default:
          message = "Something went wrong with voice input. Please try again.";
          break;
      }
      setError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [Ctor, detachHandlers, isSupported]);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        detachHandlers(recognition);
        recognition.abort();
        recognitionRef.current = null;
      }
    };
  }, [detachHandlers]);

  return { isSupported, isListening, error, start, stop };
}
