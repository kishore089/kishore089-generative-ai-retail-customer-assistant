import { Alert } from "@heroui/react";

import { Loading, PageHeader, StatusBadge } from "@/components/common";
import { DataTable } from "@/components/tables";
import type { Column } from "@/components/tables";
import { useSupportTickets } from "@/hooks";
import type { SupportTicket } from "@/services";
import { getApiErrorMessage } from "@/utils/apiError";

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

const ticketColumns: Column<SupportTicket>[] = [
  { key: "TicketID", header: "Ticket ID" },
  { key: "OrderID", header: "Order ID" },
  { key: "Issue", header: "Issue" },
  {
    key: "Priority",
    header: "Priority",
    render: (ticket) => <StatusBadge value={ticket.Priority} />,
  },
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
  {
    key: "AssignedAgent",
    header: "Assigned Agent",
    render: (ticket) => ticket.AssignedAgent ?? "—",
  },
];

/**
 * Protected Support page — lists the active customer's support tickets from the
 * live API via {@link useSupportTickets}, with shared loading / error / empty
 * states. The "New ticket" action is presentational only in this iteration.
 */
export function SupportPage() {
  const { data, isLoading, isError, error } = useSupportTickets();

  return (
    <div>
      <PageHeader
        title="Support"
        description="View your support tickets and open new requests."
        actions={
          <button
            type="button"
            className="flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            New ticket
          </button>
        }
      />

      {isLoading ? (
        <Loading label="Loading support tickets…" />
      ) : isError ? (
        <Alert status="danger">
          <Alert.Title>Couldn&apos;t load support tickets</Alert.Title>
          <Alert.Description>{getApiErrorMessage(error)}</Alert.Description>
        </Alert>
      ) : (data ?? []).length === 0 ? (
        <Alert status="default">
          <Alert.Title>No support tickets found</Alert.Title>
          <Alert.Description>There are no support tickets for this customer yet.</Alert.Description>
        </Alert>
      ) : (
        <DataTable
          columns={ticketColumns}
          rows={data ?? []}
          getRowId={(ticket) => ticket.TicketID}
        />
      )}
    </div>
  );
}

export default SupportPage;
