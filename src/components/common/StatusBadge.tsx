/**
 * Shared status badge.
 *
 * Maps a free-form status string (lowercased) to a color scheme via keyword
 * matching, with a neutral default. Renders a rounded-full, capitalized pill
 * matching the badge styling used across the domain pages.
 */
export interface StatusBadgeProps {
  /** Free-form status/priority string from the API. */
  value: string;
}

const GREEN = /deliver|success|succeed|refund|resolved|complete|approved/;
const AMBER = /pending|process|request|ship|open|initiat/;
const RED = /cancel|fail|reject|closed/;

const GREEN_CLASSES =
  "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
const AMBER_CLASSES =
  "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
const RED_CLASSES =
  "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
const NEUTRAL_CLASSES =
  "bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300";

function classesFor(value: string): string {
  const lowered = value.toLowerCase();
  if (GREEN.test(lowered)) return GREEN_CLASSES;
  if (AMBER.test(lowered)) return AMBER_CLASSES;
  if (RED.test(lowered)) return RED_CLASSES;
  return NEUTRAL_CLASSES;
}

/**
 * Renders a colored status pill for an arbitrary status/priority string.
 * Falls back to a neutral primary color when no keyword matches.
 */
export function StatusBadge({ value }: StatusBadgeProps) {
  const display = value.trim() === "" ? "—" : value;
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize " +
        classesFor(value)
      }
    >
      {display}
    </span>
  );
}

export default StatusBadge;
