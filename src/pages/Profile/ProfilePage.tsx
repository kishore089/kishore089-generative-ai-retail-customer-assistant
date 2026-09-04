import { SectionCard } from "@/components/cards";
import { PageHeader, Loading, ErrorState } from "@/components/common";
import { useCustomer } from "@/contexts/CustomerContext";

/**
 * Formats a date-like string for display. Guards empty and unparseable values
 * by returning the raw value (or an em dash placeholder when absent).
 */
function formatDate(value: string | null): string {
  if (value === null || value.trim() === "") {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ProfileFieldProps {
  label: string;
  value: string;
}

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-200 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-700">
      <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="text-sm text-neutral-900 dark:text-neutral-100">{value}</dd>
    </div>
  );
}

/** Renders a value or an em dash placeholder when null/empty. */
function orDash(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "—";
  }
  return value;
}

/**
 * Protected Profile page (Requirements 5.x, 14.1-14.3, 14.6).
 *
 * Reads the signed-in customer's details from the global Customer Context
 * (populated from `GET /customer`). Because it derives from context, it
 * auto-updates when another customer logs in.
 */
export function ProfilePage() {
  const {
    customerId,
    name,
    email,
    phone,
    address,
    city,
    state,
    membership,
    status,
    joinedDate,
    rewardPoints,
    preferredLanguage,
    preferredPaymentMethod,
    preferredDeliveryAddress,
    membershipBenefits,
    isLoading,
  } = useCustomer();

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Your account details and membership information."
      />

      {isLoading ? (
        <SectionCard title="Account Details">
          <Loading label="Loading profile…" />
        </SectionCard>
      ) : customerId === null ? (
        <ErrorState
          title="Profile unavailable"
          message="We couldn't load your profile."
        />
      ) : (
        <SectionCard title="Account Details">
          <dl>
            <ProfileField label="Customer ID" value={orDash(customerId)} />
            <ProfileField label="Name" value={orDash(name)} />
            <ProfileField label="Email" value={orDash(email)} />
            <ProfileField label="Phone" value={orDash(phone)} />
            <ProfileField label="Address" value={orDash(address)} />
            <ProfileField label="City" value={orDash(city)} />
            <ProfileField label="State" value={orDash(state)} />
            <ProfileField label="Membership" value={orDash(membership)} />
            <ProfileField label="Status" value={orDash(status)} />
            <ProfileField label="Joined Date" value={formatDate(joinedDate)} />
            <ProfileField
              label="Reward Points"
              value={rewardPoints === null ? "—" : String(rewardPoints)}
            />
            <ProfileField
              label="Preferred Language"
              value={orDash(preferredLanguage)}
            />
            <ProfileField
              label="Preferred Payment Method"
              value={orDash(preferredPaymentMethod)}
            />
            <ProfileField
              label="Preferred Delivery Address"
              value={orDash(preferredDeliveryAddress)}
            />
            {membershipBenefits && membershipBenefits.length > 0 ? (
              <div className="flex flex-col gap-1 border-b border-neutral-200 py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between dark:border-neutral-700">
                <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Membership Benefits
                </dt>
                <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                  <ul className="list-disc space-y-1 pl-5 text-left">
                    {membershipBenefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : (
              <ProfileField label="Membership Benefits" value="—" />
            )}
          </dl>
        </SectionCard>
      )}
    </div>
  );
}

export default ProfilePage;
