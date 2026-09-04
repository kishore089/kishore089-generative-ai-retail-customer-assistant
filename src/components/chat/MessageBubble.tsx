import { FiSquare, FiVolume2 } from "react-icons/fi";

import type { ChatMessage } from "@/types/chat";

export interface MessageBubbleProps {
  /** The chat message to render. */
  message: ChatMessage;
  /** Whether text-to-speech is available for assistant messages. */
  canSpeak?: boolean;
  /** Whether this specific message is currently being spoken aloud. */
  isSpeaking?: boolean;
  /** Invoked to toggle reading this message aloud. */
  onToggleSpeak?: (message: ChatMessage) => void;
}

/**
 * A single chat message rendered as a rounded bubble.
 *
 * User messages align to the right with the blue enterprise primary colour;
 * assistant and system messages align to the left with a neutral surface.
 * When {@link ChatMessage.pending} is true a subtle animated "typing" hint is
 * shown to signal an in-flight response.
 *
 * When {@link MessageBubbleProps.canSpeak} is true, assistant/system messages
 * with settled, non-empty content show a subtle speaker button to read the
 * response aloud (or stop it while speaking).
 */
export function MessageBubble({
  message,
  canSpeak = false,
  isSpeaking = false,
  onToggleSpeak,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  const containerClasses = isUser ? "flex justify-end" : "flex justify-start";

  const bubbleClasses = isUser
    ? "bg-primary-500 text-white"
    : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50";

  const showSpeakButton =
    canSpeak &&
    !isUser &&
    !message.pending &&
    message.content.trim().length > 0 &&
    !!onToggleSpeak;

  return (
    <div className={containerClasses}>
      <div className="flex max-w-[75%] flex-col items-start gap-1">
        <div
          className={
            "w-full whitespace-pre-wrap break-words rounded-lg px-4 py-2 text-sm shadow-sm " +
            bubbleClasses
          }
        >
          {message.pending ? (
            <span className="inline-flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
              <span className="animate-pulse">typing</span>
              <span className="animate-pulse [animation-delay:150ms]">.</span>
              <span className="animate-pulse [animation-delay:300ms]">.</span>
              <span className="animate-pulse [animation-delay:450ms]">.</span>
            </span>
          ) : (
            message.content
          )}
        </div>

        {showSpeakButton ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded px-1 text-xs text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
            aria-label={isSpeaking ? "Stop speaking" : "Read response aloud"}
            title={isSpeaking ? "Stop speaking" : "Read response aloud"}
            onClick={() => onToggleSpeak(message)}
          >
            {isSpeaking ? (
              <FiSquare aria-hidden />
            ) : (
              <FiVolume2 aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
