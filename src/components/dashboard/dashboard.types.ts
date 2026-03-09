import type { PriceHistoryPeriod } from '@/types/api'

export type DashboardTab = 'dashboard' | 'products' | 'history' | 'runs'
export type DashboardOverviewRange = '7d' | '30d' | '90d' | '6m' | '1y'

export interface DashboardOverviewPoint {
  date: string
  label: string
  value: number
  capturedAt: string
  canonicalUrl: string
  sellerName: string | null
  searchRunId: string
}

export interface DashboardOverviewMinimumItem {
  periodStart: string
  capturedAt: string
  productTitle: string
  canonicalUrl: string
  price: number
  currency: string
  sellerName: string | null
  searchRunId: string
}

export interface DashboardOverviewSeries {
  productId: string
  productTitle: string
  currency: string
  period: PriceHistoryPeriod
  startAt: string
  endAt: string
  currentValue: number | null
  previousValue: number | null
  deltaPercent: number | null
  lowValue: number | null
  highValue: number | null
  latestCapturedAt: string | null
  minimumItem: DashboardOverviewMinimumItem | null
  points: DashboardOverviewPoint[]
}
