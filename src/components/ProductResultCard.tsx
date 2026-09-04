import { useState } from "react";

export interface ProductResult {
  ProductName: string;
  Brand?: string;
  Price?: number;
  Rating?: number;
  StockStatus?: string;
  Stock?: number;
  RecommendationReason?: string;
}

export interface ProductResultCardProps {
  product: ProductResult;
}

/** Format a price with Indian grouping (paired with the ₹ symbol). */
function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

/** Emoji dot reflecting a stock-status label. */
function stockDot(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("out")) {
    return "\uD83D\uDD34"; // red
  }
  if (s.includes("limited")) {
    return "\uD83D\uDFE1"; // yellow
  }
  return "\uD83D\uDFE2"; // green (in stock / default)
}

/**
 * Compact, responsive product result card for AI product-search replies.
 *
 * Shows only fields present in the parsed product (name, brand, price, rating,
 * stock, and an optional recommendation reason); nothing is invented. Stock is
 * shown from `StockStatus` (Format A) or derived from `Stock` units otherwise
 * (Format B). "View Details" toggles an inline panel — no modal and no API call.
 */
export function ProductResultCard({ product }: ProductResultCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const hasPrice =
    typeof product.Price === "number" && Number.isFinite(product.Price);
  const hasRating =
    typeof product.Rating === "number" && Number.isFinite(product.Rating);
  const hasUnits =
    typeof product.Stock === "number" && Number.isFinite(product.Stock);
  const isRecommended =
    typeof product.RecommendationReason === "string" &&
    product.RecommendationReason.trim() !== "";

  const price = hasPrice ? formatPrice(product.Price as number) : "";
  const rating = hasRating ? (product.Rating as number).toFixed(1) : "";

  const stockLabel =
    product.StockStatus && product.StockStatus.trim() !== ""
      ? product.StockStatus.trim()
      : hasUnits
        ? (product.Stock as number) > 0
          ? `${product.Stock} in stock`
          : "Out of stock"
        : "";

  const stockEmoji = product.StockStatus
    ? stockDot(product.StockStatus)
    : hasUnits && (product.Stock as number) > 0
      ? "\uD83D\uDFE2"
      : "\uD83D\uDD34";

  return (
    <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
        {product.ProductName}
      </span>
      {product.Brand && product.Brand.trim() !== "" ? (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {product.Brand}
        </span>
      ) : null}

      {isRecommended ? (
        <span className="mt-1 inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          {"\uD83C\uDFC6"} Recommended
        </span>
      ) : null}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {hasPrice ? (
          <span className="font-medium text-neutral-900 dark:text-neutral-50">
            {"\u20B9"}
            {price}
          </span>
        ) : null}
        {hasRating ? (
          <span className="text-neutral-600 dark:text-neutral-300">
            {"\u2B50"} {rating}
          </span>
        ) : null}
        {stockLabel !== "" ? (
          <span className="text-neutral-600 dark:text-neutral-300">
            {stockEmoji} {stockLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-2">
        <button
          type="button"
          aria-expanded={showDetails}
          onClick={() => setShowDetails((v) => !v)}
          className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {showDetails ? "Hide Details" : "View Details"}
        </button>
      </div>

      {showDetails ? (
        <dl className="mt-2 flex flex-col gap-1 border-t border-neutral-200 pt-2 text-xs dark:border-neutral-700">
          <div className="flex justify-between gap-2">
            <dt className="text-neutral-500 dark:text-neutral-400">Product</dt>
            <dd className="text-right text-neutral-900 dark:text-neutral-50">
              {product.ProductName}
            </dd>
          </div>
          {product.Brand && product.Brand.trim() !== "" ? (
            <div className="flex justify-between gap-2">
              <dt className="text-neutral-500 dark:text-neutral-400">Brand</dt>
              <dd className="text-right text-neutral-900 dark:text-neutral-50">
                {product.Brand}
              </dd>
            </div>
          ) : null}
          {hasPrice ? (
            <div className="flex justify-between gap-2">
              <dt className="text-neutral-500 dark:text-neutral-400">Price</dt>
              <dd className="text-right text-neutral-900 dark:text-neutral-50">
                {"\u20B9"}
                {price}
              </dd>
            </div>
          ) : null}
          {hasRating ? (
            <div className="flex justify-between gap-2">
              <dt className="text-neutral-500 dark:text-neutral-400">Rating</dt>
              <dd className="text-right text-neutral-900 dark:text-neutral-50">
                {"\u2B50"} {rating}
              </dd>
            </div>
          ) : null}
          {stockLabel !== "" ? (
            <div className="flex justify-between gap-2">
              <dt className="text-neutral-500 dark:text-neutral-400">Stock</dt>
              <dd className="text-right text-neutral-900 dark:text-neutral-50">
                {stockLabel}
              </dd>
            </div>
          ) : null}
          {isRecommended ? (
            <div className="flex flex-col gap-0.5">
              <dt className="text-neutral-500 dark:text-neutral-400">
                Why recommended
              </dt>
              <dd className="text-neutral-900 dark:text-neutral-50">
                {product.RecommendationReason}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}

export default ProductResultCard;
