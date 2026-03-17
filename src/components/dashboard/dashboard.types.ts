import type { PriceHistoryPeriod, SourceFilterValue } from '@/types/api'

export type DashboardTab = 'dashboard' | 'products' | 'history' | 'runs'
export type DashboardOverviewRange = '7d' | '30d' | '90d' | '6m' | '1y'
export type DashboardOverviewGranularity = PriceHistoryPeriod
export type DashboardOverviewSourceFilterValue = SourceFilterValue

export interface DashboardOverviewSourcePoint {
  date: string
  label: string
  value: number
  capturedAt: string
  canonicalUrl: string
  sellerName: string | null
  searchRunId: string
  productTitle: string
  sourceName: string
  sourceLabel: string
}

export interface DashboardOverviewMinimumItem {
  periodStart: string
  capturedAt: string
  productTitle: string
  sourceProductTitle: string
  canonicalUrl: string
  price: number
  currency: string
  sellerName: string | null
  searchRunId: string
  sourceName: string
  sourceLabel: string
}

export interface DashboardOverviewSourceSeries {
  sourceName: string
  sourceLabel: string
  colorToken: string
  currentValue: number | null
  previousValue: number | null
  deltaPercent: number | null
  lowValue: number | null
  highValue: number | null
  latestCapturedAt: string | null
  minimumItem: DashboardOverviewMinimumItem | null
  points: DashboardOverviewSourcePoint[]
}

export interface DashboardOverviewSeries {
  productId: string
  productTitle: string
  currency: string
  period: PriceHistoryPeriod
  startAt: string
  endAt: string
  sourceFilter: DashboardOverviewSourceFilterValue
  summarySourceName: string | null
  summarySourceLabel: string | null
  visibleSourceCount: number
  currentValue: number | null
  previousValue: number | null
  deltaPercent: number | null
  lowValue: number | null
  highValue: number | null
  latestCapturedAt: string | null
  minimumItem: DashboardOverviewMinimumItem | null
  sources: DashboardOverviewSourceSeries[]
}
