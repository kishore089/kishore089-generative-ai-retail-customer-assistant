import { Alert } from "@heroui/react";
import { Link } from "react-router-dom";

import { InfoCard, SectionCard, StatCard } from "@/components/cards";
import { ErrorState, Loading, PageHeader, StatusBadge } from "@/components/common";
import { DataTable } from "@/components/tables";
import type { Column } from "@/components/tables";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useOrders, usePayments, useReturns, useSupportTickets } from "@/hooks";
import { PATHS } from "@/routes/paths";
import type { Order, Payment, ReturnRecord, SupportTicket } from "@/services";
import { getApiErrorMessage } from "@/utils/apiError";

const RECENT_LIMIT = 5;

const PENDING_RETURN = /pending|request|process|initiat/i;
const OPEN_TICKET = /open|pending|progress/i;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const recentOrderColumns: Column<Order>[] = [
  { key: "OrderID", header: "Order ID" },
  { key: "ProductName", header: "Product Name" },
  {
    key: "Status",
    header: "Status",
    render: (order) => <StatusBadge value={order.Status} />,
  },
  { key: "OrderDate", header: "Order Date", render: (order) => formatDate(order.OrderDate) },
];

const recentPaymentColumns: Column<Payment>[] = [
  { key: "PaymentID", header: "Payment ID" },
  {
    key: "Amount",
    header: "Amount",
    align: "end",
    render: (payment) => formatCurrency(payment.Amount),
  },
  {
    key: "Status",
    header: "Status",
    render: (payment) => <StatusBadge value={payment.Status} />,
  },
  { key: "Date", header: "Date", render: (payment) => formatDate(payment.Date) },
];

const recentReturnColumns: Column<ReturnRecord>[] = [
  { key: "ReturnID", header: "Return ID" },
  {
    key: "Status",
    header: "Status",
    render: (record) => <StatusBadge value={record.Status} />,
  },
  { key: "Reason", header: "Reason" },
  {
    key: "CreatedDate",
    header: "Created",
    render: (record) => formatDate(record.CreatedDate),
  },
];

const recentTicketColumns: Column<SupportTicket>[] = [
  { key: "TicketID", header: "Ticket ID" },
  { key: "Issue", header: "Issue" },
  {
    key: "Status",
    header: "Status",
    render: (ticket) => <StatusBadge value={ticket.Status} />,
  },
  {
    key: "CreatedDate",
    header: "Created",
    render: (ticket) => formatDate(ticket.CreatedDate),
  },
];

/**
 * Customer Dashboard (Objectives 6 & 11).
 *
 * Reads the active customer profile from {@link useCustomer} and presents a
 * profile summary, an AI Assistant quick-access card, live KPI stat cards, and
 * recent-activity sections. All domain data is fetched live via the React Query
 * hooks, scoped to the active customer. No mock data.
 */
export function DashboardPage() {
  const {
    name,
    email,
    phone,
    customerId,
    membership,
    rewardPoints,
    address,
    city,
    state,
    membershipBenefits,
    isLoading,
  } = useCustomer();
  const { user } = useAuth();

  const ordersQuery = useOrders();
  const paymentsQuery = usePayments();
  const returnsQuery = useReturns();
  const ticketsQuery = useSupportTickets();

  // Loading state: while the active customer is being hydrated, show the
  // profile-loading indicator. This takes precedence over the error gate below.
  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          description="A quick overview of your account activity and support status."
        />
        <Loading label="Loading your profile…" />
      </div>
    );
  }

  // Edge handling: no resolvable customer. The page stays mounted; the session
  // is retained.
  if (customerId === null) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          description="A quick overview of your account activity and support status."
        />
        <ErrorState message="We couldn't load your account information." />
      </div>
    );
  }

  const addressLine = [address, city, state].filter(Boolean).join(", ");
  const displayName = name ?? user?.displayName ?? "there";

  const orders = ordersQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const returns = returnsQuery.data ?? [];
  const tickets = ticketsQuery.data ?? [];

  const pendingReturnsCount = returns.filter((r) => PENDING_RETURN.test(r.Status)).length;
  const openTicketsCount = tickets.filter((t) => OPEN_TICKET.test(t.Status)).length;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description="A quick overview of your account activity and support status."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Your profile" description="Account details on file.">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Name</dt>
              <dd className="mt-0.5 text-neutral-900 dark:text-neutral-100">{name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Customer ID
              </dt>
              <dd className="mt-0.5 text-neutral-900 dark:text-neutral-100">
                {customerId ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Membership
              </dt>
              <dd className="mt-0.5 text-neutral-900 dark:text-neutral-100">
                {membership ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Reward Points
              </dt>
              <dd className="mt-0.5 text-neutral-900 dark:text-neutral-100">
                {rewardPoints ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Email</dt>
              <dd className="mt-0.5 break-all text-neutral-900 dark:text-neutral-100">
                {email ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Phone</dt>
              <dd className="mt-0.5 text-neutral-900 dark:text-neutral-100">{phone ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Address
              </dt>
              <dd className="mt-0.5 text-neutral-900 dark:text-neutral-100">
                {addressLine || "—"}
              </dd>
            </div>
            {membershipBenefits && membershipBenefits.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Membership Benefits
                </dt>
                <dd className="mt-0.5 text-neutral-900 dark:text-neutral-100">
                  <ul className="list-inside list-disc space-y-0.5">
                    {membershipBenefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </InfoCard>

        <InfoCard
          title="AI Assistant"
          description="Get instant answers about your orders, returns, and account."
          footer={
            <Link
              to={PATHS.aiAssistant}
              className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Ask the AI Assistant
            </Link>
          }
        >
          <p>
            Need a hand? Our assistant can help you track a shipment, start a return, or explain a
            charge in seconds.
          </p>
        </InfoCard>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Recent Orders" value={orders.length} loading={ordersQuery.isLoading} />
        <StatCard
          label="Pending Returns"
          value={pendingReturnsCount}
          loading={returnsQuery.isLoading}
        />
        <StatCard
          label="Open Support Tickets"
          value={openTicketsCount}
          loading={ticketsQuery.isLoading}
        />
        <StatCard label="Payments" value={payments.length} loading={paymentsQuery.isLoading} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Recent Orders"
          footer={
            <Link
              to={PATHS.orders}
              className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
            >
              View all orders
            </Link>
          }
        >
          {ordersQuery.isError ? (
            <Alert status="danger">
              <Alert.Title>Couldn&apos;t load orders</Alert.Title>
              <Alert.Description>{getApiErrorMessage(ordersQuery.error)}</Alert.Description>
            </Alert>
          ) : (
            <DataTable
              columns={recentOrderColumns}
              rows={orders.slice(0, RECENT_LIMIT)}
              loading={ordersQuery.isLoading}
              emptyMessage="No recent orders."
              getRowId={(order) => order.OrderID}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Recent Payments"
          footer={
            <Link
              to={PATHS.payments}
              className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
            >
              View all payments
            </Link>
          }
        >
          {paymentsQuery.isError ? (
            <Alert status="danger">
              <Alert.Title>Couldn&apos;t load payments</Alert.Title>
              <Alert.Description>{getApiErrorMessage(paymentsQuery.error)}</Alert.Description>
            </Alert>
          ) : (
            <DataTable
              columns={recentPaymentColumns}
              rows={payments.slice(0, RECENT_LIMIT)}
              loading={paymentsQuery.isLoading}
              emptyMessage="No recent payments."
              getRowId={(payment) => payment.PaymentID}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Recent Returns"
          footer={
            <Link
              to={PATHS.returns}
              className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
            >
              View all returns
            </Link>
          }
        >
          {returnsQuery.isError ? (
            <Alert status="danger">
              <Alert.Title>Couldn&apos;t load returns</Alert.Title>
              <Alert.Description>{getApiErrorMessage(returnsQuery.error)}</Alert.Description>
            </Alert>
          ) : (
            <DataTable
              columns={recentReturnColumns}
              rows={returns.slice(0, RECENT_LIMIT)}
              loading={returnsQuery.isLoading}
              emptyMessage="No recent returns."
              getRowId={(record) => record.ReturnID}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Recent Support Tickets"
          footer={
            <Link
              to={PATHS.support}
              className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
            >
              View all support tickets
            </Link>
          }
        >
          {ticketsQuery.isError ? (
            <Alert status="danger">
              <Alert.Title>Couldn&apos;t load support tickets</Alert.Title>
              <Alert.Description>{getApiErrorMessage(ticketsQuery.error)}</Alert.Description>
            </Alert>
          ) : (
            <DataTable
              columns={recentTicketColumns}
              rows={tickets.slice(0, RECENT_LIMIT)}
              loading={ticketsQuery.isLoading}
              emptyMessage="No recent support tickets."
              getRowId={(ticket) => ticket.TicketID}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export default DashboardPage;
