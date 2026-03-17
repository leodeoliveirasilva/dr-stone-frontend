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

export interface SourceMetadata {
  source_name: string
  source_label: string
}

export interface SourceOption extends SourceMetadata {
  active: boolean
}

export type SourceFilterValue = string

export interface SourcesResponse {
  sources: SourceOption[]
}

export interface TrackedProduct {
  id: string
  product_title: string
  search_terms: string[]
  active: boolean
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
  is_available: boolean | number
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
  tracked_product_active: boolean | number | null
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
  price: string
  currency: string
  seller_name: string | null
  search_run_id: string
  source_name: string
  source_label: string
}

export interface ProductHistoryResponse {
  product_id: string
  product_title: string
  source_filter: SourceFilterValue
  limit: number
  offset: number
  has_more: boolean
  next_offset: number | null
  start_at: string | null
  end_at: string | null
  items: ProductHistoryEntry[]
}

export type PriceHistoryPeriod = 'day' | 'week' | 'month'

export interface PriceHistoryMinimumEntry extends ProductHistoryEntry {
  period_start: string
  source_product_title: string
}

export interface PriceHistoryMinimumSeries extends SourceMetadata {
  items: PriceHistoryMinimumEntry[]
}

export interface PriceHistoryMinimumsResponse {
  product_id: string
  product_title: string
  granularity: PriceHistoryPeriod
  period: PriceHistoryPeriod
  start_at: string
  end_at: string
  source_filter: SourceFilterValue
  series: PriceHistoryMinimumSeries[]
  items: PriceHistoryMinimumEntry[]
}

export interface UpsertTrackedProductPayload {
  title: string
  search_terms: string[]
  active: boolean
}

export interface CollectResult {
  tracked_product_id: string
  search_run_ids: string[]
  successful_runs: number
  failed_runs: number
  total_results: number
  matched_results: number
  page_count: number
}

export interface LegacyTrackedProductResponse {
  id: string
  product_title?: string
  title?: string
  search_term?: string
  search_terms?: string[]
  active: boolean | number
  created_at: string
  updated_at: string
  source_name?: string
  scrapes_per_day?: number
}

export interface LegacyProductHistoryEntryResponse {
  captured_at: string
  product_title: string
  canonical_url: string
  price?: string
  price_value?: string
  currency: string
  seller_name: string | null
  search_run_id: string
  source_name?: string
  source_label?: string
}

export interface LegacyProductHistoryResponse {
  product_id: string
  product_title?: string
  source_filter?: string
  limit: number
  offset: number
  has_more: boolean
  next_offset: number | null
  start_at: string | null
  end_at: string | null
  items: LegacyProductHistoryEntryResponse[]
}

export interface LegacyPriceHistoryMinimumEntryResponse extends LegacyProductHistoryEntryResponse {
  period_start: string
  source_product_title?: string
}

export interface LegacyPriceHistoryMinimumSeriesResponse {
  source_name?: string
  source_label?: string
  items: LegacyPriceHistoryMinimumEntryResponse[]
}

export interface LegacyPriceHistoryMinimumsResponse {
  product_id: string
  product_title?: string
  granularity?: PriceHistoryPeriod
  period: PriceHistoryPeriod
  start_at: string
  end_at: string
  source_filter?: string
  series?: LegacyPriceHistoryMinimumSeriesResponse[]
  items: LegacyPriceHistoryMinimumEntryResponse[]
}
