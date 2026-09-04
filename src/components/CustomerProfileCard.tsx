export interface CustomerProfileCardProps {
  name: string | null;
  membership: string | null;
  city: string | null;
  benefits: string[] | null;
}

/**
 * Compact, read-only customer context card shown above the AI chat. Renders
 * only non-sensitive fields (name, membership, city, benefits) from the active
 * customer context — phone and email are intentionally never shown. Renders
 * nothing when there is no active customer name.
 */
export function CustomerProfileCard({
  name,
  membership,
  city,
  benefits,
}: CustomerProfileCardProps) {
  if (!name || name.trim() === "") {
    return null;
  }

  const cleanBenefits = (benefits ?? []).filter(
    (b) => typeof b === "string" && b.trim() !== "",
  );

  return (
    <div className="mb-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          {"\uD83D\uDC64"} {name}
        </span>
        {membership && membership.trim() !== "" ? (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {membership} Member
          </span>
        ) : null}
        {city && city.trim() !== "" ? (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {"\uD83D\uDCCD"} {city}
          </span>
        ) : null}
      </div>
      {cleanBenefits.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {cleanBenefits.map((b) => (
            <li
              key={b}
              className="text-xs text-neutral-600 dark:text-neutral-300"
            >
              {"\u2713"} {b}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default CustomerProfileCard;
