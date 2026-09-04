export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
