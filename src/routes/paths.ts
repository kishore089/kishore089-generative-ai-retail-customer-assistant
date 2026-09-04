export const PATHS = {
  root: "/",
  dashboard: "/dashboard",
  aiAssistant: "/ai-assistant",
  orders: "/orders",
  returns: "/returns",
  payments: "/payments",
  support: "/support",
  profile: "/profile",
  settings: "/settings",
  login: "/login",
  adminDashboard: "/admin",
  customerSearch: "/admin/customers",
  orderManagement: "/admin/orders",
  notFound: "*",
} as const;

export type AppPath = (typeof PATHS)[keyof typeof PATHS];
