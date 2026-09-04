/**
 * Small defensive parse helpers shared by the domain service modules.
 *
 * Backend list endpoints return an envelope like `{ success, data: T[] }`, but
 * these helpers stay defensive and also tolerate bare arrays and inconsistent
 * key casing / value types coming from the live API Gateway.
 */

/**
 * Extracts a list of plain object records from an arbitrary response body.
 *
 * - If `body` is an array, its elements are used.
 * - Else if `body` is an object:
 *   - if `body.data` is an array, that is used;
 *   - else if `body.data` is a non-null object (a nested envelope such as
 *     `{ data: { activeOrders: [...] } }`), the first array-valued property
 *     found within it is used;
 *   - otherwise an empty list is returned.
 * - Otherwise an empty list is returned.
 *
 * The result is always filtered to plain (non-null) objects.
 */
export function extractList(body: unknown): Record<string, unknown>[] {
  let source: unknown[];
  if (Array.isArray(body)) {
    source = body;
  } else if (typeof body === "object" && body !== null) {
    const data = (body as { data?: unknown }).data;
    if (Array.isArray(data)) {
      source = data;
    } else if (typeof data === "object" && data !== null) {
      const nestedArray = Object.values(data as Record<string, unknown>).find(
        (value): value is unknown[] => Array.isArray(value),
      );
      source = nestedArray ?? [];
    } else {
      source = [];
    }
  } else {
    source = [];
  }

  return source.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null,
  );
}

/**
 * Returns the first key whose value is a non-empty string, or a `String()`-
 * coerced finite number; otherwise `undefined`.
 */
export function str(
  rec: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = rec[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return undefined;
}

/**
 * Returns the first key whose value is coercible to a finite number; otherwise
 * `undefined`.
 */
export function num(
  rec: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = rec[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
}

/**
 * Returns the first key that is a boolean, or a `"true"`/`"false"` string;
 * otherwise `undefined`.
 */
export function bool(
  rec: Record<string, unknown>,
  ...keys: string[]
): boolean | undefined {
  for (const key of keys) {
    const value = rec[key];
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      const lowered = value.toLowerCase();
      if (lowered === "true") {
        return true;
      }
      if (lowered === "false") {
        return false;
      }
    }
  }
  return undefined;
}
