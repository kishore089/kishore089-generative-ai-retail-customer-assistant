import { Button as HeroButton } from "@heroui/react";
import type { ButtonProps } from "@heroui/react";

/**
 * Enterprise Button wrapper over the HeroUI v3 Button primitive.
 *
 * Applies the blue enterprise "primary" variant as the default while forwarding
 * every HeroUI Button prop (including `ref`, which HeroUI models as a prop in
 * React 19). Consumers can override the default by passing `variant` explicitly.
 */
export function Button({ variant = "primary", ...rest }: ButtonProps) {
  return <HeroButton variant={variant} {...rest} />;
}

export type { ButtonProps };
