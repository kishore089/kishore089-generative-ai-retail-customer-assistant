import { SectionCard } from "@/components/cards";
import { PageHeader } from "@/components/common";

interface ToggleRowProps {
  label: string;
  description: string;
  defaultChecked?: boolean;
}

/**
 * Presentational toggle row. The checkbox reflects a default state but carries
 * no persistence logic in this placeholder iteration.
 */
function ToggleRow({ label, description, defaultChecked = false }: ToggleRowProps) {
  return (
    <label className="flex items-start justify-between gap-4 border-b border-neutral-200 py-3 last:border-b-0 dark:border-neutral-700">
      <span className="flex flex-col">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</span>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">{description}</span>
      </span>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800"
      />
    </label>
  );
}

/**
 * Protected Settings page (Requirements 14.1-14.3, 14.6).
 *
 * Groups account preferences into titled sections. All controls are
 * presentational placeholders; real persistence is deferred to a later task.
 */
export function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your preferences and account options."
      />

      <div className="flex flex-col gap-6">
        <SectionCard title="Appearance">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Switch between light and dark themes using the theme toggle in the top
            bar. Your preference is applied across the app.
          </p>
        </SectionCard>

        <SectionCard title="Notifications">
          <div className="flex flex-col">
            <ToggleRow
              label="Order updates"
              description="Get notified about shipping and delivery changes."
              defaultChecked
            />
            <ToggleRow
              label="Support replies"
              description="Receive an alert when an agent responds to your ticket."
              defaultChecked
            />
            <ToggleRow
              label="Promotions"
              description="Occasional offers and product recommendations."
            />
          </div>
        </SectionCard>

        <SectionCard title="Account">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Account management options such as password changes and data export
            will be available here.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

export default SettingsPage;
