import { useCallback, useEffect, useState } from "react";

export interface UseSpeechSynthesisResult {
  /** Whether the browser exposes the Web Speech synthesis API. */
  isSupported: boolean;
  /** Whether an utterance is currently being spoken. */
  isSpeaking: boolean;
  /** Speak the given text, cancelling any in-progress utterance first. */
  speak: (text: string) => void;
  /** Cancel any in-progress speech. */
  cancel: () => void;
}

/** Resolve synthesis support, guarding SSR. */
function getIsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

/**
 * Reusable text-to-speech hook built on the browser's Web Speech API.
 *
 * Exposes supported/speaking state and `speak`/`cancel` controls. Speaking a
 * new utterance cancels any current one to prevent overlap, and any active
 * speech is cancelled on unmount.
 */
export function useSpeechSynthesis(): UseSpeechSynthesisResult {
  const isSupported = getIsSupported();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || text.trim() === "") {
        return;
      }

      // Cancel any queued/current utterance to avoid overlapping playback.
      window.speechSynthesis.cancel();

      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported],
  );

  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [isSupported]);

  useEffect(() => {
    return () => {
      if (getIsSupported()) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { isSupported, isSpeaking, speak, cancel };
}
