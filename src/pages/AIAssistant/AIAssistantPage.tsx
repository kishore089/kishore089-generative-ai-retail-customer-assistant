import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { PageHeader } from "@/components/common";
import { ChatWindow } from "@/components/chat";
import { OrderCard } from "@/components/OrderCard";
import { CustomerProfileCard } from "@/components/CustomerProfileCard";
import { ProductResultCard } from "@/components/ProductResultCard";
import type { ProductResult } from "@/components/ProductResultCard";
import { useSpeechSynthesis } from "@/hooks";
import { useCustomer } from "@/contexts/CustomerContext";
import {
  sendLexMessage,
  extractAssistantTexts,
  getLexSessionId,
  getConversationStartTime,
} from "@/services/lex.service";
import type {
  LexChatResponse,
  LexServiceError,
} from "@/services/lex.service";
import { getOrders } from "@/services/orders.service";
import type { Order } from "@/services/orders.service";
import { endConversation, completeAcw } from "@/services/conversation.service";
import type {
  EndConversationResponse,
  AcwCompleteResponse,
} from "@/services/conversation.service";
import { getApiErrorMessage } from "@/utils/apiError";
import type { ApiError } from "@/types/api";
import type { ChatMessage } from "@/types/chat";

/** Matches an order id like ORD1022 anywhere in the text (case-insensitive). */
const ORDER_ID_REGEX = /\bORD\d+\b/i;

/** True when the Lex response intent is OrderStatus (case-insensitive). */
function isOrderStatusIntent(res: LexChatResponse): boolean {
  return (
    typeof res.intent === "string" && res.intent.toLowerCase() === "orderstatus"
  );
}

/**
 * Extract the first order id from a Lex response, scanning the top-level
 * `message` and every `messages[].content` entry (the id may not be in the
 * first sentence). Returns the id upper-cased, or null when none is present.
 */
function detectOrderId(res: LexChatResponse): string | null {
  const parts: string[] = [];
  if (typeof res.message === "string") {
    parts.push(res.message);
  }
  if (Array.isArray(res.messages)) {
    for (const m of res.messages) {
      if (m && typeof m.content === "string") {
        parts.push(m.content);
      }
    }
  }
  const match = parts.join(" ").match(ORDER_ID_REGEX);
  return match ? match[0].toUpperCase() : null;
}

/**
 * Format B single line, e.g.
 * "- Galaxy S25 Ultra: Priced at ₹32367 with a 5.0 rating and 7 units in stock."
 */
const PRODUCT_LINE_REGEX =
  /^[\s\-\u2022*]*(.+?):\s*Priced at\s*\u20B9?\s*([\d,]+(?:\.\d+)?)\s*with a\s*([\d.]+)\s*rating and\s*(\d+)\s*units?\s*in stock/i;

/**
 * Splits a response into product sections at numbered markers (`1.`, `2.`, …),
 * even when every product shares a single line. A decimal such as `5.0` is not
 * a marker because a marker requires whitespace immediately after the dot.
 */
const NUMBERED_MARKER_REGEX = /(?:^|\s)\d+\.\s+/;

/**
 * Parses one product section (the text after a `N.` marker). Extracts the
 * name/brand from the head (text before the first field or newline), then
 * price, rating, optional stock, and an optional recommendation reason from
 * anywhere in the section. Field labels require a `:`/`-` separator, so
 * recommendation prose ("...currently in stock.") never matches a Stock field
 * and a real `Stock:` value found earlier is never overwritten. Returns null
 * unless a name, price, and rating are all present.
 */
function parseProductSection(section: string): ProductResult | null {
  const priceLabelIdx = section.search(/[-\u2013]?\s*price\s*[:-]/i);
  const newlineIdx = section.indexOf("\n");
  let cut = section.length;
  if (priceLabelIdx >= 0) {
    cut = Math.min(cut, priceLabelIdx);
  }
  if (newlineIdx >= 0) {
    cut = Math.min(cut, newlineIdx);
  }
  const head = section
    .slice(0, cut)
    .replace(/\*\*/g, "")
    .replace(/^[\s\-\u2022*]+/, "")
    .trim();

  let productName = head;
  let brand: string | undefined;
  const byMatch = head.match(/^(.*?)\s+by\s+(.+)$/i);
  if (byMatch) {
    productName = byMatch[1].trim();
    brand = byMatch[2].trim().replace(/[.\s]+$/, "");
  }
  if (productName === "") {
    return null;
  }

  const priceMatch =
    section.match(/price\s*[:-]?\s*\u20B9?\s*([\d,]+(?:\.\d+)?)/i) ??
    section.match(/\u20B9\s*([\d,]+(?:\.\d+)?)/);
  const price = priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : NaN;

  const ratingMatch =
    section.match(/rating\s*[:-]?\s*(\d+(?:\.\d+)?)/i) ??
    section.match(/(\d+(?:\.\d+)?)\s*rating/i);
  const rating = ratingMatch ? Number(ratingMatch[1]) : NaN;

  if (!Number.isFinite(price) || !Number.isFinite(rating)) {
    return null;
  }

  const product: ProductResult = {
    ProductName: productName,
    Price: price,
    Rating: rating,
  };
  if (brand) {
    product.Brand = brand;
  }

  const stockMatch = section.match(/stock\s*[:-]\s*([A-Za-z][A-Za-z ]*)/i);
  if (stockMatch) {
    product.StockStatus = stockMatch[1].trim().replace(/[.\s]+$/, "");
  } else {
    const unitsMatch = section.match(/(\d+)\s*units?\s+in\s+stock/i);
    if (unitsMatch) {
      product.Stock = Number(unitsMatch[1]);
    }
  }

  const recMatch = section.match(
    /recommend(?:ed|ation(?:\s+reason)?)?\b[:\s]*(?:because\s+)?(.+)/i,
  );
  if (recMatch) {
    const reason = recMatch[1].trim().replace(/[.\s]+$/, "");
    if (reason !== "") {
      product.RecommendationReason = reason;
    }
  }

  return product;
}

/**
 * Parses an assistant reply into intro prose and structured product rows,
 * independent of the user's query.
 *
 * Primary strategy: split the response at numbered markers (`1.`, `2.`, …) —
 * which works whether products are on separate lines or all on one line — and
 * parse each section. Fallback: the compact single-line
 * "- Name: Priced at ₹X with a Y rating and Z units in stock." format.
 *
 * A product is emitted only when it has a name, price, and rating, so normal
 * prose and numbered instructions without product fields yield zero products.
 * No values are invented.
 */
function parseProductResults(text: string): {
  intro: string;
  products: ProductResult[];
} {
  const products: ProductResult[] = [];

  const sections = text.split(NUMBERED_MARKER_REGEX);
  if (sections.length > 1) {
    for (let i = 1; i < sections.length; i += 1) {
      const product = parseProductSection(sections[i]);
      if (product) {
        products.push(product);
      }
    }
    if (products.length > 0) {
      return { intro: sections[0].trim(), products };
    }
  }

  const introLines: string[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line === "") {
      continue;
    }
    const bLine = line.match(PRODUCT_LINE_REGEX);
    if (bLine) {
      const price = Number(bLine[2].replace(/,/g, ""));
      const rating = Number(bLine[3]);
      const units = Number(bLine[4]);
      const productName = bLine[1].trim();
      if (productName !== "" && Number.isFinite(price)) {
        products.push({
          ProductName: productName,
          Price: price,
          Rating: Number.isFinite(rating) ? rating : undefined,
          Stock: Number.isFinite(units) ? units : undefined,
        });
      }
    } else {
      introLines.push(line);
    }
  }

  return { intro: introLines.join("\n"), products };
}

/** Live Order Panel state, keyed per assistant message id. */
type OrderPanel =
  | { state: "loading"; orderId: string }
  | { state: "ready"; orderId: string; order: Order }
  | { state: "unavailable"; orderId: string }
  | { state: "error"; orderId: string };

/** Generate a RFC4122 id, falling back when `crypto.randomUUID` is unavailable. */
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Format a whole number of seconds as `MM:SS`. */
function formatTimer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
}

/** Seed message shown when the conversation first loads. */
const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "Hi! I'm your retail assistant. Ask me about your orders, returns, payments and more.",
  createdAt: new Date().toISOString(),
};

/**
 * Protected AI Assistant page.
 *
 * A full-height chat shell wired to the real Amazon Lex backend via the
 * {@link sendLexMessage} service through a React Query mutation. The user's
 * message is appended optimistically; the assistant's reply (or replies) are
 * appended on success. A stable per-customer `sessionId` is resolved from
 * storage so the whole conversation shares one Lex session, and the
 * conversation resets when the active customer changes.
 *
 * When an assistant reply has intent OrderStatus and contains an order id, the
 * page fetches the live order via the existing `getOrders` service (reusing a
 * per-conversation cache) and renders a live OrderCard beneath that reply. A
 * compact, read-only customer context card is shown above the chat.
 *
 * The page also supports ending the conversation and completing After-Call
 * Work (ACW) via the real `/conversation/end` and `/conversation/acw-complete`
 * routes. A visual-only ACW timer ticks while processing; the backend-computed
 * duration remains the authoritative value displayed on completion.
 */
export function AIAssistantPage() {
  const { customerId, name, membership, city, membershipBenefits } =
    useCustomer();

  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [orderPanels, setOrderPanels] = useState<Record<string, OrderPanel>>(
    {},
  );
  const [productPanels, setProductPanels] = useState<
    Record<string, ProductResult[]>
  >({});

  // Per-conversation cache of the active customer's orders so repeated order
  // questions don't re-hit GET /orders. Reset when the customer changes.
  const ordersCacheRef = useRef<Order[] | null>(null);
  const customerIdRef = useRef<string | null>(customerId);

  const {
    isSupported: canSpeak,
    isSpeaking,
    speak,
    cancel,
  } = useSpeechSynthesis();
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Conversation-end / ACW state.
  const [ended, setEnded] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);
  const [acwStartTime, setAcwStartTime] = useState<string | null>(null);
  const [acwDurationSeconds, setAcwDurationSeconds] = useState<number | null>(
    null,
  );
  const [acwDurationMinutes, setAcwDurationMinutes] = useState<number | null>(
    null,
  );
  const [endError, setEndError] = useState<string | null>(null);
  const [acwError, setAcwError] = useState<string | null>(null);
  const [acwElapsed, setAcwElapsed] = useState(0);

  // Stable per-customer conversation identifiers. Never hardcoded — sourced
  // from the shared session helpers keyed on the active customer.
  const sessionId = useMemo(
    () => (customerId ? getLexSessionId(customerId) : ""),
    [customerId],
  );
  const conversationStartTime = useMemo(
    () => (customerId ? getConversationStartTime(customerId) : ""),
    [customerId],
  );

  /** Toggle reading a specific assistant message aloud. */
  const onToggleSpeak = (message: ChatMessage) => {
    if (isSpeaking && speakingId === message.id) {
      cancel();
      setSpeakingId(null);
    } else {
      speak(message.content);
      setSpeakingId(message.id);
    }
  };

  /** Append one assistant message with the given text. */
  const appendAssistantText = (text: string) => {
    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
  };

  // Reset the conversation when the active customer changes. This synchronizes
  // local chat state to an external lifecycle (the active customer switching in
  // Customer Context); there is no render-time equivalent for that transition.
  useEffect(() => {
    customerIdRef.current = customerId;
    ordersCacheRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset chat on customer change
    setMessages([GREETING]);
    setOrderPanels({});
    setProductPanels({});
    cancel();
    setSpeakingId(null);
    setEnded(false);
    setCompleted(false);
    setAnalyticsId(null);
    setAcwStartTime(null);
    setAcwDurationSeconds(null);
    setAcwDurationMinutes(null);
    setEndError(null);
    setAcwError(null);
    setAcwElapsed(0);
  }, [customerId, cancel]);

  /**
   * Fetch the live order for a detected id and attach the result to the given
   * assistant message. Reuses the per-conversation orders cache and guards
   * against stale updates if the active customer changes mid-flight.
   */
  const loadOrderPanel = async (
    messageId: string,
    orderId: string,
    activeCustomerId: string,
  ) => {
    setOrderPanels((prev) => ({
      ...prev,
      [messageId]: { state: "loading", orderId },
    }));
    try {
      let orders = ordersCacheRef.current;
      if (orders === null) {
        orders = await getOrders(activeCustomerId);
        if (customerIdRef.current === activeCustomerId) {
          ordersCacheRef.current = orders;
        }
      }
      if (customerIdRef.current !== activeCustomerId) {
        return;
      }
      const match = orders.find(
        (o) => o.OrderID.trim().toUpperCase() === orderId.toUpperCase(),
      );
      setOrderPanels((prev) => ({
        ...prev,
        [messageId]: match
          ? { state: "ready", orderId, order: match }
          : { state: "unavailable", orderId },
      }));
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[AIAssistant] Failed to load live order details:", err);
      }
      if (customerIdRef.current !== activeCustomerId) {
        return;
      }
      setOrderPanels((prev) => ({
        ...prev,
        [messageId]: { state: "error", orderId },
      }));
    }
  };

  const acwMutation = useMutation<AcwCompleteResponse, ApiError, string>({
    mutationFn: (aId) => completeAcw({ analyticsId: aId }),
    onSuccess: (res) => {
      setAcwError(null);
      setAcwDurationSeconds(res.acwDurationSeconds ?? null);
      setAcwDurationMinutes(res.acwDurationMinutes ?? null);
      setCompleted(true);
    },
    onError: (err) => {
      if (import.meta.env.DEV) {
        console.error("[AIAssistant] ACW complete failed:", err);
      }
      setAcwError(getApiErrorMessage(err));
    },
  });

  const endMutation = useMutation<EndConversationResponse, ApiError, void>({
    mutationFn: () =>
      endConversation({
        customerId: customerId ?? "",
        sessionId,
        conversationStartTime,
      }),
    onSuccess: (res) => {
      setEndError(null);
      setEnded(true);
      setAcwElapsed(0);
      setAnalyticsId(res.analyticsId ?? null);
      setAcwStartTime(res.acwStartTime ?? new Date().toISOString());
      if (res.analyticsId) {
        acwMutation.mutate(res.analyticsId);
      } else {
        setAcwError(
          "Post-conversation processing could not start (missing analytics ID).",
        );
      }
    },
    onError: (err) => {
      if (import.meta.env.DEV) {
        console.error("[AIAssistant] End conversation failed:", err);
      }
      setEndError(getApiErrorMessage(err));
    },
  });

  const mutation = useMutation<
    LexChatResponse,
    LexServiceError,
    { message: string; customerId: string; sessionId: string }
  >({
    mutationFn: (vars) => sendLexMessage(vars),
    onSuccess: (res, vars) => {
      const texts = extractAssistantTexts(res);

      // Product results: render compact cards when the reply clearly contains
      // product blocks (Format A `N. **Name** by Brand` or Format B lines), but
      // never for order-status replies. Uses only the existing response (no new
      // API calls) and emits nothing for normal prose, so ordinary messages
      // stay as plain text.
      if (texts.length > 0 && !isOrderStatusIntent(res)) {
        const { intro, products } = parseProductResults(texts.join("\n"));
        if (products.length > 0) {
          const introText =
            intro.trim() !== ""
              ? intro.trim()
              : "Here are the products I found:";
          const productMessage: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: introText,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, productMessage]);
          setProductPanels((prev) => ({
            ...prev,
            [productMessage.id]: products,
          }));
          if (canSpeak) {
            speak(introText);
            setSpeakingId(productMessage.id);
          }
          return;
        }
      }

      let lastCreatedId: string | null = null;
      if (texts.length > 0) {
        const created: ChatMessage[] = texts.map((t) => ({
          id: generateId(),
          role: "assistant" as const,
          content: t,
          createdAt: new Date().toISOString(),
        }));
        lastCreatedId = created[created.length - 1].id;
        setMessages((prev) => [...prev, ...created]);

        // Auto-speak the assistant reply on success only.
        if (canSpeak) {
          speak(texts.join(" "));
          setSpeakingId(lastCreatedId);
        }
      } else {
        appendAssistantText("I didn't get a response. Please try again.");
      }

      // Live Order Panel: only fetch when this is an OrderStatus response AND
      // an order id is present. Never fetch for other intents/messages.
      if (lastCreatedId && isOrderStatusIntent(res)) {
        const detectedOrderId = detectOrderId(res);
        if (detectedOrderId) {
          void loadOrderPanel(lastCreatedId, detectedOrderId, vars.customerId);
        }
      }
    },
    onError: (err) => {
      if (import.meta.env.DEV) {
        console.error("[AIAssistant] Lex error:", err);
      }
      appendAssistantText(err.message);
    },
  });

  const onSend = (content: string) => {
    if (ended) {
      return;
    }
    if (content.trim() === "") {
      return;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    if (!customerId) {
      appendAssistantText(
        "No customer is selected. Please select a customer before using the AI Assistant.",
      );
      return;
    }

    mutation.mutate({ message: content, customerId, sessionId });
  };

  /** End the conversation once; guarded against duplicate/double-click calls. */
  const handleEndConversation = () => {
    if (!customerId || endMutation.isPending || ended) {
      return;
    }
    setEndError(null);
    endMutation.mutate();
  };

  /** Retry ACW completion; guarded against duplicate calls. */
  const handleRetryAcw = () => {
    if (!analyticsId || acwMutation.isPending || completed) {
      return;
    }
    setAcwError(null);
    acwMutation.mutate(analyticsId);
  };

  // Visual-only ACW timer. The backend remains the source of truth for the
  // final duration; this merely reflects elapsed processing time in the UI.
  useEffect(() => {
    if (!ended || completed || !acwStartTime) {
      return;
    }
    const startMs = new Date(acwStartTime).getTime();
    const base = Number.isNaN(startMs) ? Date.now() : startMs;
    const id = window.setInterval(() => {
      setAcwElapsed(Math.max(0, Math.floor((Date.now() - base) / 1000)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [ended, completed, acwStartTime]);

  /** Render the live Order Panel (card / loading / states) beneath a message. */
  const renderMessageFooter = (message: ChatMessage) => {
    const products = productPanels[message.id];
    if (products && products.length > 0) {
      return (
        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {products.map((product, index) => (
            <ProductResultCard
              key={`${product.ProductName}-${index}`}
              product={product}
            />
          ))}
        </div>
      );
    }

    const panel = orderPanels[message.id];
    if (!panel) {
      return null;
    }
    if (panel.state === "loading") {
      return (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Loading order details&hellip;
        </span>
      );
    }
    if (panel.state === "error") {
      return (
        <span className="text-xs text-red-500" role="alert">
          Unable to load live order details.
        </span>
      );
    }
    if (panel.state === "unavailable") {
      return (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Order details are currently unavailable.
        </span>
      );
    }
    return (
      <OrderCard
        order={panel.order}
        onCancelled={(cancelledOrder, response) => {
          appendAssistantText(
            `\u2713 Order ${response.OrdersID ?? cancelledOrder.OrderID} has been cancelled successfully.`,
          );
        }}
      />
    );
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="AI Assistant"
        description="Ask about your orders, returns, payments, and more."
      />

      <CustomerProfileCard
        name={name}
        membership={membership}
        city={city}
        benefits={membershipBenefits}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <ChatWindow
          messages={messages}
          onSend={onSend}
          isSending={mutation.isPending}
          canSpeak={canSpeak}
          speakingId={speakingId}
          onToggleSpeak={onToggleSpeak}
          composerDisabled={ended}
          renderMessageFooter={renderMessageFooter}
        />
      </div>

      <div className="mt-3">
        {!ended ? (
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/60 dark:text-red-400 dark:hover:bg-red-500/10"
              disabled={!customerId || endMutation.isPending}
              onClick={handleEndConversation}
            >
              {endMutation.isPending ? "Ending\u2026" : "End Conversation"}
            </button>
            {endError ? (
              <p className="text-xs text-red-500" role="alert">
                {endError}
              </p>
            ) : null}
          </div>
        ) : null}

        {ended && !completed ? (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
              Conversation Ended
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Post-conversation processing&hellip;
            </p>
            <p className="mt-2 font-mono text-sm text-neutral-700 dark:text-neutral-200">
              ACW: {formatTimer(acwElapsed)}
            </p>
            {acwError ? (
              <div className="mt-3 flex flex-col items-start gap-2">
                <p className="text-xs text-red-500" role="alert">
                  {acwError}
                </p>
                <button
                  type="button"
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  disabled={acwMutation.isPending || !analyticsId}
                  onClick={handleRetryAcw}
                >
                  {acwMutation.isPending ? "Retrying\u2026" : "Retry"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {completed ? (
          <div className="rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-500/50 dark:bg-green-500/10">
            <p className="text-sm font-bold text-green-800 dark:text-green-300">
              Conversation Completed
            </p>
            <p className="mt-1 text-xs text-green-700 dark:text-green-400">
              Thank you for contacting us.
            </p>
            <p className="mt-2 text-sm text-green-800 dark:text-green-300">
              ACW: {acwDurationSeconds ?? "\u2014"} seconds
              {acwDurationMinutes != null
                ? ` (${acwDurationMinutes} minutes)`
                : ""}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AIAssistantPage;
