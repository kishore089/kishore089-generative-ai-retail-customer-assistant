import type { ReactNode } from "react";

import type { ChatMessage } from "@/types/chat";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

export interface ChatWindowProps {
  /** Ordered conversation messages, oldest first. */
  messages: ChatMessage[];
  /** Invoked with the trimmed content when the user sends a message. */
  onSend: (content: string) => void;
  /** When true, a send is in flight — disables the composer. */
  isSending: boolean;
  /** Whether text-to-speech is available for assistant messages. */
  canSpeak?: boolean;
  /** Id of the message currently being spoken aloud, if any. */
  speakingId?: string | null;
  /** Invoked to toggle reading a message aloud. */
  onToggleSpeak?: (message: ChatMessage) => void;
  /** When true, locks the composer (e.g. after the conversation ends). */
  composerDisabled?: boolean;
  /** Optional render slot shown beneath each message (e.g. a live Order Card). */
  renderMessageFooter?: (message: ChatMessage) => ReactNode;
}

/**
 * The AI Assistant chat shell: a full-height column with a scrollable
 * {@link MessageList} on top and a pinned {@link MessageInput} at the bottom.
 *
 * While {@link ChatWindowProps.isSending} is true the composer is disabled to
 * prevent overlapping sends. Text-to-speech props are forwarded to the list so
 * assistant messages can be read aloud, and an optional per-message footer slot
 * lets callers render supplemental content (such as a live order card).
 */
export function ChatWindow({
  messages,
  onSend,
  isSending,
  canSpeak,
  speakingId,
  onToggleSpeak,
  composerDisabled,
  renderMessageFooter,
}: ChatWindowProps) {
  return (
    <div className="flex h-full flex-col">
      <MessageList
        messages={messages}
        canSpeak={canSpeak}
        speakingId={speakingId}
        onToggleSpeak={onToggleSpeak}
        renderMessageFooter={renderMessageFooter}
      />
      <MessageInput
        onSend={onSend}
        disabled={isSending || Boolean(composerDisabled)}
      />
    </div>
  );
}
