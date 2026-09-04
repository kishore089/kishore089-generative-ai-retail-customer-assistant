/**
 * Global Axios instance for the Retail Customer Assistant backend.
 *
 * Configured with the API base URL from the Vite environment
 * (`VITE_API_BASE_URL`). Shared by all service modules so requests use a single
 * consistent client.
 */

import axios from "axios";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

export default api;
