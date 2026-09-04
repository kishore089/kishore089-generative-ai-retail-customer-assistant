/**
 * Product service — calls the live API Gateway endpoint `GET /products`.
 *
 * Resolves a single product by id and maps the `data` envelope defensively via
 * the shared parse helpers. Uses the shared Axios `api` instance; no new client
 * and no mock data.
 */

import { api } from "@/services/api";
import { normalizeError } from "@/utils/http/normalizeError";

import { str, num, bool } from "./parse";

export interface Product {
  ProductsID: string;
  ProductName: string;
  Brand?: string;
  Category?: string;
  Price?: number;
  Rating?: number;
  Stock?: number;
  StockStatus?: string;
  Offer?: string;
  HasOffer?: boolean;
}

/** Narrows an unknown value to a plain (non-null, non-array) object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Defensively maps an arbitrary record into a {@link Product}. */
function mapProduct(rec: Record<string, unknown>): Product {
  return {
    ProductsID: str(rec, "ProductsID", "ProductID", "productId", "id") ?? "",
    ProductName: str(rec, "ProductName", "productName", "name") ?? "",
    Brand: str(rec, "Brand", "brand"),
    Category: str(rec, "Category", "category"),
    Price: num(rec, "Price", "price"),
    Rating: num(rec, "Rating", "rating"),
    Stock: num(rec, "Stock", "stock"),
    StockStatus: str(rec, "StockStatus", "stockStatus"),
    Offer: str(rec, "Offer", "offer"),
    HasOffer: bool(rec, "HasOffer", "hasOffer"),
  };
}

/**
 * Retrieves a single product by id from the live backend
 * (`GET /products?productId=...`). Returns the parsed `data` object only, never
 * the raw Axios response.
 *
 * @param productId - The product id (e.g. from an order's product field).
 * @throws ApiError - Normalized error on request failure.
 */
export async function getProduct(productId: string): Promise<Product> {
  try {
    const res = await api.get("/products", { params: { productId } });
    const body: unknown = res.data;
    const data = isRecord(body) && isRecord(body.data)
      ? body.data
      : isRecord(body)
        ? body
        : {};
    return mapProduct(data);
  } catch (err) {
    throw normalizeError(err);
  }
}
