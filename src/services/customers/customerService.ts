/**
 * Customers service (live API).
 *
 * Exposes a `CustomerService` contract backed by `ApiCustomerService`, which
 * calls the real Customer Profile API (`GET /customer?customerId=...`) via the
 * shared Axios instance. The exported `customerService` singleton and the
 * `CustomerService` interface are unchanged so consumers do not change.
 *
 * Requirements: 5.1, 6.2, 6.3, 11.1, 11.4.
 */

import axios from "axios";

import { api } from "@/services/api";
import { mapCustomer, type CustomerApiData } from "@/services/customerMapper";
import type { Customer, CustomerSearchQuery } from "@/types/customer";
import { normalizeError } from "@/utils/http/normalizeError";

export interface CustomerService {
  getById(customerId: string): Promise<Customer | null>;
  getByEmail(email: string): Promise<Customer | null>;
  search(query: CustomerSearchQuery): Promise<Customer[]>;
}

/** Envelope returned by the Customer Profile API. */
interface CustomerApiResponse {
  success: boolean;
  data?: CustomerApiData | null;
}

/** Envelope returned by the Customer Profile API's email lookup. */
interface CustomerByEmailResponse {
  success: boolean;
  customer?: CustomerApiData | null;
  data?: CustomerApiData | null;
}

export class ApiCustomerService implements CustomerService {
  async getById(customerId: string): Promise<Customer | null> {
    try {
      const res = await api.get<CustomerApiResponse>("/customer", {
        params: { customerId },
      });
      const body = res.data;
      if (body && body.success === true && body.data) {
        return mapCustomer(body.data);
      }
      // success:false or no data => not found.
      return null;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      // Network/server/unexpected -> normalized ApiError thrown.
      throw normalizeError(err);
    }
  }

  async getByEmail(email: string): Promise<Customer | null> {
    try {
      const res = await api.get<CustomerByEmailResponse>("/customer", {
        params: { email },
      });
      const body = res.data;
      if (body && body.success === true) {
        const record = body.customer ?? body.data ?? null;
        if (record) {
          return mapCustomer(record);
        }
      }
      // success:false or no record => not found.
      return null;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw normalizeError(err);
    }
  }

  async search(query: CustomerSearchQuery): Promise<Customer[]> {
    // Only the live endpoint's customerId lookup is supported.
    const id = query.customerId?.trim();
    if (id) {
      const c = await this.getById(id);
      return c ? [c] : [];
    }
    // Email/phone search is not supported by the current endpoint.
    return [];
  }
}

export const customerService: CustomerService = new ApiCustomerService();
