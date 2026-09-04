import type { ReactNode } from "react";
import { motion } from "framer-motion";

export interface FadeInProps {
  /** Content to reveal with the fade/slide animation. */
  children: ReactNode;
  /** Optional class names applied to the animated wrapper. */
  className?: string;
  /** Animation duration in milliseconds. Defaults to 200ms. */
  durationMs?: number;
  /** Delay before the animation starts, in milliseconds. Defaults to 0ms. */
  delayMs?: number;
}

/**
 * Reusable wrapper that fades and slides its children into view on mount and
 * out on unmount. Designed to be composed inside an `AnimatePresence` when exit
 * animations are required.
 */
export function FadeIn({ children, className, durationMs = 200, delayMs = 0 }: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: durationMs / 1000, delay: delayMs / 1000 }}
    >
      {children}
    </motion.div>
  );
}

export default FadeIn;
