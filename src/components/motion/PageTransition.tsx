import type { ReactNode } from "react";
import { motion } from "framer-motion";

export interface PageTransitionProps {
  /** Routed page content to animate on entry and exit. */
  children: ReactNode;
  /** Optional class names applied to the animated wrapper. */
  className?: string;
}

/**
 * Wraps routed page content in a subtle fade/slide transition. Intended to be
 * placed inside an `AnimatePresence` (keyed by route) so pages animate in as
 * they mount and out as they unmount.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
