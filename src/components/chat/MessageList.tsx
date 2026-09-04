import type { ReactNode } from "react";

import type { ChatMessage } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";

export interface MessageListProps {
  /** Ordered list of messages to render, oldest first. */
  messages: ChatMessage[];
  /** Whether text-to-speech is available for assistant messages. */
  canSpeak?: boolean;
  /** Id of the message currently being spoken aloud, if any. */
  speakingId?: string | null;
  /** Invoked to toggle reading a message aloud. */
  onToggleSpeak?: (message: ChatMessage) => void;
  /** Optional render slot shown beneath each message bubble. */
  renderMessageFooter?: (message: ChatMessage) => ReactNode;
}

/**
 * A scrollable, vertically stacked list of {@link MessageBubble}s.
 *
 * Fills the available height and scrolls its overflow. When there are no
 * messages it renders a friendly empty prompt inviting the user to start.
 * Text-to-speech props are threaded through to each bubble, and an optional
 * per-message footer slot is rendered directly beneath each bubble.
 */
export function MessageList({
  messages,
  canSpeak = false,
  speakingId = null,
  onToggleSpeak,
  renderMessageFooter,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-6 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Ask a question to start the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((message) => (
        <div key={message.id} className="flex flex-col gap-1">
          <MessageBubble
            message={message}
            canSpeak={canSpeak}
            isSpeaking={speakingId === message.id}
            onToggleSpeak={onToggleSpeak}
          />
          {renderMessageFooter ? renderMessageFooter(message) : null}
        </div>
      ))}
    </div>
  );
}
