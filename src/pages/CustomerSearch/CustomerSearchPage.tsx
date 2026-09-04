import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "@heroui/react";

import { PageHeader, EmptyState, Loading } from "@/components/common";
import { useCustomer } from "@/contexts/CustomerContext";
import { PATHS } from "@/routes/paths";
import { customerService } from "@/services/customers";
import { searchCustomers } from "@/services/customerSearch.service";
import { addRecentCustomer } from "@/utils/recentCustomers";
import { getApiErrorMessage } from "@/utils/apiError";
import type { Customer } from "@/types/customer";
import type { ApiError } from "@/types/api";

const inputClasses =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500";

const labelClasses =
  "mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200";

/** Renders a value or an em dash placeholder when null/empty. */
function orDash(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "—";
  }
  return value;
}

interface SearchParams {
  customerId?: string;
  email?: string;
  phone?: string;
}

/**
 * Admin customer search page (Requirements 6.2-6.8, 7.2).
 *
 * Provides three optional inputs (Customer ID, Email, Phone). On submit it
 * builds search params from the non-empty fields and calls the live
 * {@link searchCustomers} endpoint through React Query. Matches render as one
 * selectable card each showing Name, CustomerID, Email, Phone, Membership, and
 * Status. Selecting a card loads the full customer profile (falling back to the
 * search result on failure) into the {@link useCustomer} context, records it in
 * the recent-customers list, and navigates to the Customer Dashboard.
 */
export function CustomerSearchPage() {
  const navigate = useNavigate();
  const { setActiveCustomer } = useCustomer();

  const [customerId, setCustomerId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const searchMutation = useMutation<Customer[], ApiError, SearchParams>({
    mutationFn: (q) => searchCustomers(q),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params: SearchParams = {};
    if (customerId.trim() !== "") params.customerId = customerId.trim();
    if (email.trim() !== "") params.email = email.trim();
    if (phone.trim() !== "") params.phone = phone.trim();

    if (Object.keys(params).length === 0) {
      return;
    }

    setHasSearched(true);
    searchMutation.mutate(params);
  };

  const openCustomer = async (customer: Customer) => {
    setSelectingId(customer.CustomerID);
    try {
      const full = await customerService.getById(customer.CustomerID);
      const chosen = full ?? customer;
      setActiveCustomer(chosen);
      addRecentCustomer(chosen);
      navigate(PATHS.dashboard);
    } catch {
      // Fall back to the search result so selection still works even if the
      // full-profile fetch fails.
      setActiveCustomer(customer);
      addRecentCustomer(customer);
      navigate(PATHS.dashboard);
    } finally {
      setSelectingId(null);
    }
  };

  const results = searchMutation.data ?? [];
  const isPending = searchMutation.isPending;
  const showNoResults =
    hasSearched && !isPending && !searchMutation.isError && results.length === 0;

  return (
    <div>
      <PageHeader
        title="Customer Search"
        description="Search by Customer ID, email, or phone number."
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="search-customer-id" className={labelClasses}>
              Customer ID
            </label>
            <input
              id="search-customer-id"
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="CUS1001"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="search-email" className={labelClasses}>
              Email
            </label>
            <input
              id="search-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@demo.com"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="search-phone" className={labelClasses}>
              Phone
            </label>
            <input
              id="search-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1-202-555-0111"
              className={inputClasses}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Searching\u2026" : "Search"}
          </button>
        </div>
      </form>

      <div className="mt-6">
        {isPending ? (
          <Loading label="Searching…" />
        ) : searchMutation.isError ? (
          <Alert status="danger">
            <Alert.Title>Search failed</Alert.Title>
            <Alert.Description>
              {getApiErrorMessage(searchMutation.error)}
            </Alert.Description>
          </Alert>
        ) : results.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((customer) => {
              const isSelecting = selectingId === customer.CustomerID;
              return (
                <li key={customer.CustomerID}>
                  <div className="flex h-full flex-col rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 truncate text-base font-semibold text-neutral-900 dark:text-neutral-50">
                        {orDash(customer.Name)}
                      </h3>
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                        {customer.CustomerID}
                      </span>
                    </div>
                    <dl className="mt-3 flex flex-col gap-1 text-sm text-neutral-600 dark:text-neutral-300">
                      <div className="flex gap-2">
                        <dt className="font-medium text-neutral-500 dark:text-neutral-400">
                          Email
                        </dt>
                        <dd className="min-w-0 truncate">
                          {orDash(customer.Email)}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="font-medium text-neutral-500 dark:text-neutral-400">
                          Phone
                        </dt>
                        <dd className="min-w-0 truncate">
                          {orDash(customer.Phone)}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="font-medium text-neutral-500 dark:text-neutral-400">
                          Membership
                        </dt>
                        <dd className="min-w-0 truncate">
                          {orDash(customer.Membership)}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="font-medium text-neutral-500 dark:text-neutral-400">
                          Status
                        </dt>
                        <dd className="min-w-0 truncate">
                          {orDash(customer.Status)}
                        </dd>
                      </div>
                    </dl>
                    <button
                      type="button"
                      onClick={() => void openCustomer(customer)}
                      disabled={isSelecting}
                      className="mt-4 inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSelecting ? "Opening\u2026" : "Open"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : showNoResults ? (
          <EmptyState
            title="No customers found"
            description="No customers match your search. Try a different Customer ID, email, or phone number."
          />
        ) : (
          <EmptyState
            title="Search for a customer"
            description="Enter a Customer ID, email, or phone number above to find and open a customer account."
          />
        )}
      </div>
    </div>
  );
}

export default CustomerSearchPage;
