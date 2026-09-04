import { Alert } from "@heroui/react";
import { Link, useNavigate } from "react-router-dom";

import { StatCard, SectionCard, InfoCard } from "@/components/cards";
import { PageHeader, EmptyState } from "@/components/common";
import { useCustomer } from "@/contexts/CustomerContext";
import { useAnalytics } from "@/hooks";
import { PATHS } from "@/routes/paths";
import { getApiErrorMessage } from "@/utils/apiError";
import { getRecentCustomers } from "@/utils/recentCustomers";
import type { Customer } from "@/types/customer";

/**
 * Formats a millisecond duration as seconds with two decimals (e.g. 9390 ->
 * "9.39 sec"). Non-finite inputs fall back to "0.00 sec".
 */
function formatSeconds(ms: number): string {
  if (!Number.isFinite(ms)) {
    return "0.00 sec";
  }
  return `${(ms / 1000).toFixed(2)} sec`;
}

/**
 * Formats a rate/percentage for display. The backend is inconsistent about
 * whether a rate arrives as a 0–1 fraction (e.g. 0.42) or an already-scaled
 * percentage (e.g. 33.33). Heuristic: values in the (0, 1] range that are not
 * whole numbers are treated as fractions and multiplied by 100; everything
 * else is used as-is. The result is rounded to one decimal with a trailing
 * ".0" dropped (0.42 -> "42%", 33.33 -> "33.3%", 0 -> "0%").
 */
function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  // 0–1 vs already-percent heuristic: a non-zero value at or below 1 is
  // interpreted as a fraction; anything above 1 is assumed to already be a
  // percentage.
  const scaled = value > 0 && value <= 1 ? value * 100 : value;
  const rounded = Math.round(scaled * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1)}%`;
}

const BADGE_BASE =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
const GREEN_BADGE =
  "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
const AMBER_BADGE =
  "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
const RED_BADGE = "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
const NEUTRAL_BADGE =
  "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300";

/** Picks a badge color class for a sentiment string. */
function sentimentBadgeClasses(sentiment: string): string {
  const lowered = sentiment.toLowerCase();
  if (lowered.includes("positive")) return GREEN_BADGE;
  if (lowered.includes("negative")) return RED_BADGE;
  return NEUTRAL_BADGE;
}

/**
 * Admin dashboard (Requirements 6.1, 7.2).
 *
 * Presented to an Admin with no active customer. Surfaces the live analytics
 * report from `GET /analytics` (request totals, response time, resolution and
 * escalation rates, sentiment breakdown, top intents and recent conversations —
 * all real values, showing zeros / empty states when the backend has no records
 * yet), the list of customers the admin has actually opened (from
 * {@link getRecentCustomers}), a prominent customer-search entry point, and
 * quick navigation. Recent customers already hold full {@link Customer}
 * objects, so selecting one loads it into the {@link useCustomer} context and
 * navigates to the Customer Dashboard directly.
 */
export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { setActiveCustomer } = useCustomer();

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    error: analyticsErr,
  } = useAnalytics();

  const recents = getRecentCustomers();

  const openCustomer = (customer: Customer) => {
    setActiveCustomer(customer);
    navigate(PATHS.dashboard);
  };

  const summary = analytics?.summary;
  const resolution = analytics?.resolution;
  const escalation = analytics?.escalation;
  const sentiment = analytics?.sentiment;
  const intents = analytics?.intents ?? [];
  const conversations = analytics?.recentConversations ?? [];

  const ahtMinutes = analytics?.conversation.averageHandleTimeMinutes;
  const ahtDisplay = `${(typeof ahtMinutes === "number" && Number.isFinite(ahtMinutes) ? ahtMinutes : 0).toFixed(2)} min`;

  const sentimentHasData =
    (sentiment?.positive ?? 0) > 0 ||
    (sentiment?.neutral ?? 0) > 0 ||
    (sentiment?.negative ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Monitor customer activity and open an account to assist a customer."
      />

      {analyticsError ? (
        <Alert status="danger" className="mb-4">
          <Alert.Title>Couldn&apos;t load analytics</Alert.Title>
          <Alert.Description>{getApiErrorMessage(analyticsErr)}</Alert.Description>
        </Alert>
      ) : null}

      {analytics?.generatedAt ? (
        <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
          Generated at {analytics.generatedAt}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Requests"
          value={summary?.totalRequests ?? 0}
          loading={analyticsLoading}
        />
        <StatCard
          label="Successful Requests"
          value={summary?.successfulRequests ?? 0}
          loading={analyticsLoading}
        />
        <StatCard
          label="Failed Requests"
          value={summary?.failedRequests ?? 0}
          loading={analyticsLoading}
        />
        <StatCard
          label="Average Response Time"
          value={formatSeconds(summary?.averageResponseTimeMs ?? 0)}
          loading={analyticsLoading}
        />
        <StatCard
          label="Average Handle Time (AHT)"
          value={ahtDisplay}
          loading={analyticsLoading}
        />
        <StatCard
          label="Resolution Rate"
          value={formatPercent(resolution?.resolutionRate ?? 0)}
          loading={analyticsLoading}
        />
        <StatCard
          label="Escalation Rate"
          value={formatPercent(escalation?.escalationRate ?? 0)}
          loading={analyticsLoading}
        />
        <StatCard
          label="Positive Sentiment"
          value={formatPercent(sentiment?.positivePercentage ?? 0)}
          loading={analyticsLoading}
        />
        <StatCard
          label="Negative Sentiment"
          value={formatPercent(sentiment?.negativePercentage ?? 0)}
          loading={analyticsLoading}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Sentiment Breakdown">
          {sentimentHasData ? (
            <ul className="flex flex-col gap-4">
              <li className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">
                    Positive
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-300">
                    {formatPercent(sentiment?.positivePercentage ?? 0)} ({sentiment?.positive ?? 0})
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: formatPercent(sentiment?.positivePercentage ?? 0) }}
                  />
                </div>
              </li>
              <li className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">
                    Neutral
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-300">
                    {formatPercent(sentiment?.neutralPercentage ?? 0)} ({sentiment?.neutral ?? 0})
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                  <div
                    className="h-full rounded-full bg-neutral-400 dark:bg-neutral-500"
                    style={{ width: formatPercent(sentiment?.neutralPercentage ?? 0) }}
                  />
                </div>
              </li>
              <li className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">
                    Negative
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-300">
                    {formatPercent(sentiment?.negativePercentage ?? 0)} ({sentiment?.negative ?? 0})
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: formatPercent(sentiment?.negativePercentage ?? 0) }}
                  />
                </div>
              </li>
            </ul>
          ) : (
            <EmptyState
              title="No sentiment data yet"
              description="Sentiment analytics will appear here once conversations are recorded."
            />
          )}
        </SectionCard>

        <SectionCard title="Top Intents">
          {intents.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {intents.map((item, index) => (
                <li
                  key={item.name ?? index}
                  className="flex items-center justify-between rounded-md border border-neutral-200 px-4 py-2.5 text-sm dark:border-neutral-700"
                >
                  <span className="min-w-0 truncate font-medium text-neutral-900 dark:text-neutral-50">
                    {item.name ?? "Unknown intent"}
                  </span>
                  {item.count !== undefined ? (
                    <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                      {item.count}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No intent activity yet"
              description="Intent analytics will appear here once conversations are recorded."
            />
          )}
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Recent Conversations">
          {conversations.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {conversations.map((conversation, index) => (
                <li
                  key={conversation.analyticsId ?? conversation.sessionId ?? index}
                  className="flex flex-col gap-1.5 rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-700"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {conversation.intent ?? "Conversation"}
                    </span>
                    {conversation.timestamp ? (
                      <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                        {conversation.timestamp}
                      </span>
                    ) : null}
                  </div>

                  {conversation.message ? (
                    <p className="truncate text-sm text-neutral-600 dark:text-neutral-300">
                      {conversation.message}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {conversation.customerId ? (
                      <span>Customer: {conversation.customerId}</span>
                    ) : null}
                    {conversation.channel ? <span>Channel: {conversation.channel}</span> : null}
                    {conversation.responseTimeMs !== undefined ? (
                      <span>Response: {formatSeconds(conversation.responseTimeMs)}</span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {conversation.sentiment ? (
                      <span
                        className={`${BADGE_BASE} capitalize ${sentimentBadgeClasses(conversation.sentiment)}`}
                      >
                        {conversation.sentiment}
                      </span>
                    ) : null}
                    {conversation.resolved === true ? (
                      <span className={`${BADGE_BASE} ${GREEN_BADGE}`}>Resolved</span>
                    ) : conversation.resolved === false ? (
                      <span className={`${BADGE_BASE} ${AMBER_BADGE}`}>Unresolved</span>
                    ) : null}
                    {conversation.escalated === true ? (
                      <span className={`${BADGE_BASE} ${RED_BADGE}`}>Escalated</span>
                    ) : conversation.escalated === false ? (
                      <span className={`${BADGE_BASE} ${NEUTRAL_BADGE}`}>Not escalated</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No recent conversations"
              description="Recent AI conversations will appear here once available."
            />
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Recent Customers"
            footer={
              <Link
                to={PATHS.customerSearch}
                className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
              >
                Search all customers
              </Link>
            }
          >
            {recents.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {recents.map((customer) => (
                  <li key={customer.CustomerID}>
                    <button
                      type="button"
                      onClick={() => openCustomer(customer)}
                      className="flex w-full flex-col items-start gap-1 rounded-md border border-neutral-200 bg-white px-4 py-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-700 dark:hover:bg-primary-900/20 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                          {customer.Name}
                        </span>
                        <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {customer.Email}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                        {customer.CustomerID}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No recent customers"
                description="No recent customers — search to open a customer account."
              />
            )}
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4">
          <InfoCard
            title="Find a customer"
            description="Search by Customer ID, email, or phone number to open an account."
            footer={
              <Link
                to={PATHS.customerSearch}
                className="flex w-full items-center justify-center rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Search customers
              </Link>
            }
          />

          <InfoCard
            title="Order Management"
            description="Look up an order and update its status."
            footer={
              <Link
                to={PATHS.orderManagement}
                className="flex w-full items-center justify-center rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Manage orders
              </Link>
            }
          />

          <SectionCard title="Quick navigation">
            <div className="flex flex-col gap-3">
              <Link
                to={PATHS.customerSearch}
                className="flex w-full items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                Customer Search
              </Link>
              <Link
                to={PATHS.orderManagement}
                className="flex w-full items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                Order Management
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
