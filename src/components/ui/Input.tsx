import { Input } from "@heroui/react";
import type { InputProps } from "@heroui/react";

/**
 * Stable internal re-export of the HeroUI v3 Input primitive.
 *
 * HeroUI's `Input` is a compound, callable component (`Input`, `Input.Root`).
 * We re-export it as-is so consumers import from a single internal surface
 * without losing any sub-components. `InputProps` is HeroUI's own prop type.
 */
export { Input };
export type { InputProps };
