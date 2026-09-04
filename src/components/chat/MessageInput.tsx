import { useState } from "react";
import type { KeyboardEvent } from "react";
import { FiMic, FiMicOff } from "react-icons/fi";

import { useSpeechRecognition } from "@/hooks";

export interface MessageInputProps {
  /** Invoked with the trimmed draft when the user submits a non-empty message. */
  onSend: (content: string) => void;
  /** When true, the textarea and send button are disabled. */
  disabled?: boolean;
  /** Placeholder text for the textarea. */
  placeholder?: string;
}

/**
 * Composer for a chat message: an optional voice-input mic button, a growable
 * textarea, and a Send button.
 *
 * Maintains the draft locally. Pressing Enter (without Shift) submits;
 * Shift+Enter inserts a newline. Empty or whitespace-only drafts are ignored.
 * The draft is cleared after a successful send. When {@link MessageInputProps.disabled}
 * is true both the input and the button are disabled.
 *
 * The mic button uses the browser's speech-to-text to populate the draft; final
 * transcripts are appended to the draft while interim text is shown as a live
 * hint. Sending still flows through {@link MessageInputProps.onSend} unchanged.
 */
export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Type your message...",
}: MessageInputProps) {
  const [draft, setDraft] = useState("");
  const [interim, setInterim] = useState("");

  const { isSupported, isListening, error, start, stop } =
    useSpeechRecognition({
      onResult: (text, isFinal) => {
        if (isFinal) {
          setDraft((prev) => (prev.trim() ? prev.trim() + " " : "") + text);
          setInterim("");
        } else {
          setInterim(text);
        }
      },
    });

  const submit = () => {
    const trimmed = draft.trim();
    if (disabled || trimmed.length === 0) {
      return;
    }
    onSend(trimmed);
    setDraft("");
    setInterim("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  };

  const canSend = !disabled && draft.trim().length > 0;
  const micDisabled = disabled || !isSupported;
  const micLabel = isListening ? "Stop voice input" : "Start voice input";
  const micTitle = !isSupported
    ? "Voice input is not supported in this browser. Please use Chrome or Edge."
    : micLabel;

  const micClasses = isListening
    ? "bg-red-500 text-white ring-2 ring-red-300 animate-pulse hover:bg-red-600"
    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700";

  return (
    <div className="border-t border-neutral-200 p-3 dark:border-neutral-700">
      <div className="flex items-end gap-2">
        <button
          type="button"
          className={
            "shrink-0 rounded-lg p-2.5 text-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 " +
            micClasses
          }
          disabled={micDisabled}
          aria-label={micLabel}
          aria-pressed={isListening}
          title={micTitle}
          onClick={toggleListening}
        >
          {isListening ? <FiMicOff aria-hidden /> : <FiMic aria-hidden />}
        </button>

        <textarea
          className="flex-1 resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
          rows={2}
          value={draft}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="shrink-0 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canSend}
          onClick={submit}
        >
          Send
        </button>
      </div>

      {isListening ? (
        <p className="mt-2 px-1 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-medium">Listening&hellip;</span>
          {interim ? <span className="italic"> {interim}</span> : null}
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 px-1 text-xs text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
