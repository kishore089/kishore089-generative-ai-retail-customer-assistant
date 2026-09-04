/* eslint-disable react-refresh/only-export-components --
 * This context module intentionally co-locates the CustomerProvider component
 * with the useCustomer hook and the CustomerContextValue contract. Splitting
 * them would fragment the customer-context abstraction; Fast Refresh is a
 * dev-only concern that does not apply to these stable exports. */
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Customer } from "@/types/customer";
import type { Order } from "@/services/orders.service";
import type { SupportTicket } from "@/services/support.service";
import { customerService } from "@/services/customers";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Typed accessors and operations for the global customer context
 * (Requirements 5.1, 5.2, 5.3, 5.4).
 */
export interface CustomerContextValue {
  customerId: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  membership: string | null;
  rewardPoints: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  membershipBenefits: string[] | null;
  joinedDate: string | null;
  preferredLanguage: string | null;
  preferredPaymentMethod: string | null;
  preferredDeliveryAddress: string | null;
  status: string | null;
  isLoading: boolean;
  selectedOrder: Order | null;
  selectedSupportTicket: SupportTicket | null;
  setActiveCustomer: (customer: Customer) => void;
  clearActiveCustomer: () => void;
  setSelectedOrder: (order: Order | null) => void;
  setSelectedSupportTicket: (ticket: SupportTicket | null) => void;
}

// Raw context is intentionally not exported — consumers use `useCustomer`.
const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const { status, role, user } = useAuth();

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [membership, setMembership] = useState<string | null>(null);
  const [rewardPoints, setRewardPoints] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [stateRegion, setStateRegion] = useState<string | null>(null);
  const [membershipBenefits, setMembershipBenefits] = useState<
    string[] | null
  >(null);
  const [joinedDate, setJoinedDate] = useState<string | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<string | null>(
    null,
  );
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<
    string | null
  >(null);
  const [preferredDeliveryAddress, setPreferredDeliveryAddress] = useState<
    string | null
  >(null);
  const [customerStatus, setCustomerStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedSupportTicket, setSelectedSupportTicket] =
    useState<SupportTicket | null>(null);

  // Sets the active customer from a Customer record; selections are left
  // untouched (Requirements 5.1, 5.2, 5.3, 5.5, 5.6).
  const setActiveCustomer = useCallback((customer: Customer) => {
    setCustomerId(customer.CustomerID);
    setName(customer.Name);
    setEmail(customer.Email);
    setPhone(customer.Phone);
    setMembership(customer.Membership ?? null);
    setRewardPoints(customer.RewardPoints ?? null);
    setAddress(customer.Address ?? null);
    setCity(customer.City ?? null);
    setStateRegion(customer.State ?? null);
    setMembershipBenefits(customer.MembershipBenefits ?? null);
    setJoinedDate(customer.JoinedDate ?? null);
    setPreferredLanguage(customer.PreferredLanguage ?? null);
    setPreferredPaymentMethod(customer.PreferredPaymentMethod ?? null);
    setPreferredDeliveryAddress(customer.PreferredDeliveryAddress ?? null);
    setCustomerStatus(customer.Status ?? null);
  }, []);

  // Clears the active customer and both selections (Requirements 5.4, 12.2).
  const clearActiveCustomer = useCallback(() => {
    setCustomerId(null);
    setName(null);
    setEmail(null);
    setPhone(null);
    setMembership(null);
    setRewardPoints(null);
    setAddress(null);
    setCity(null);
    setStateRegion(null);
    setMembershipBenefits(null);
    setJoinedDate(null);
    setPreferredLanguage(null);
    setPreferredPaymentMethod(null);
    setPreferredDeliveryAddress(null);
    setCustomerStatus(null);
    setSelectedOrder(null);
    setSelectedSupportTicket(null);
  }, []);

  // Clear-on-signout: when auth transitions to unauthenticated, drop any
  // active customer and selections (Requirement 12.2).
  useEffect(() => {
    if (status === "unauthenticated") {
      // Intentional: this effect synchronizes local customer state to the
      // external auth lifecycle. On sign-out we must reset the active customer
      // and selections; there is no render-time equivalent for a transition
      // that originates outside this provider (Requirement 12.2).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      clearActiveCustomer();
    }
  }, [status, clearActiveCustomer]);

  // Auto-load / restore: when the authenticated user is a Customer with a
  // customer id and no active customer is loaded yet, hydrate it via the
  // customer service. This covers auto-load after login (Requirement 3.5) and
  // restore on startup from the persisted session (Requirement 13.3). Admins
  // have no active customer until they select one.
  useEffect(() => {
    if (role !== "Customer") return;
    const targetId = user?.customerId ?? null;
    if (targetId === null) return;
    if (customerId !== null) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async external hydration
    setIsLoading(true);
    void (async () => {
      try {
        const customer = await customerService.getById(targetId);
        if (!cancelled && customer) {
          setActiveCustomer(customer);
        }
      } catch {
        // Swallow: the dashboard surfaces the "no account information" state
        // via a null customerId; the session is retained (Requirement 3.6).
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, user?.customerId, customerId, setActiveCustomer]);

  const value = useMemo<CustomerContextValue>(
    () => ({
      customerId,
      name,
      email,
      phone,
      membership,
      rewardPoints,
      address,
      city,
      state: stateRegion,
      membershipBenefits,
      joinedDate,
      preferredLanguage,
      preferredPaymentMethod,
      preferredDeliveryAddress,
      status: customerStatus,
      isLoading,
      selectedOrder,
      selectedSupportTicket,
      setActiveCustomer,
      clearActiveCustomer,
      setSelectedOrder,
      setSelectedSupportTicket,
    }),
    [
      customerId,
      name,
      email,
      phone,
      membership,
      rewardPoints,
      address,
      city,
      stateRegion,
      membershipBenefits,
      joinedDate,
      preferredLanguage,
      preferredPaymentMethod,
      preferredDeliveryAddress,
      customerStatus,
      isLoading,
      selectedOrder,
      selectedSupportTicket,
      setActiveCustomer,
      clearActiveCustomer,
    ],
  );

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer(): CustomerContextValue {
  const context = useContext(CustomerContext);
  if (context === null) {
    throw new Error(
      "useCustomer must be used within a <CustomerProvider>. " +
        "Wrap a parent component (typically in App.tsx) with <CustomerProvider>.",
    );
  }
  return context;
}
