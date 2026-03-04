export interface ApiErrorResponse {
  error: string
  error_type?: string
}

export interface HealthResponse {
  status: 'ok'
}

export interface RootResponse {
  name: 'dr-stone-api'
  status: 'ok'
}

export interface TrackedProduct {
  id: string
  source_name: string
  product_title: string
  search_term: string
  scrapes_per_day: number
  active: number
  created_at: string
  updated_at: string
}

export interface SearchRunItem {
  search_run_id: string
  product_title: string
  canonical_url: string
  price_value: string
  currency: string
  seller_name: string | null
  availability: string
  is_available: number
  position: number
  captured_at: string
}

export interface SearchRun {
  id: string
  tracked_product_id: string
  source_name: string
  search_term: string
  search_url: string
  status: 'running' | 'succeeded' | 'failed'
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  total_results: number | null
  matched_results: number | null
  page_count: number | null
  message: string | null
  created_at: string
  tracked_product_title: string | null
  tracked_product_active: number | null
  items: SearchRunItem[]
}

export interface SearchRunsResponse {
  date: string | null
  runs: SearchRun[]
}

export interface ProductHistoryEntry {
  captured_at: string
  product_title: string
  canonical_url: string
  price_value: string
  currency: string
  seller_name: string | null
  search_run_id: string
}

export interface UpsertTrackedProductPayload {
  title: string
  search_term: string
  source: string
  scrapes_per_day: number
  active: boolean
}

export interface CollectResult {
  tracked_product_id: string
  search_run_id: string
  total_results: number
  matched_results: number
  page_count: number
}
