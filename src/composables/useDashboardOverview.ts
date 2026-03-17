import { ref, shallowRef } from 'vue'

import { ALL_SOURCES_FILTER, fetchPriceHistoryMinimums } from '@/composables/useDrStoneApi'
import type {
  DashboardOverviewGranularity,
  DashboardOverviewMinimumItem,
  DashboardOverviewRange,
  DashboardOverviewSeries,
  DashboardOverviewSourceFilterValue,
  DashboardOverviewSourcePoint,
  DashboardOverviewSourceSeries
} from '@/components/dashboard/dashboard.types'
import type {
  PriceHistoryMinimumEntry,
  PriceHistoryMinimumsResponse,
  PriceHistoryPeriod,
  TrackedProduct
} from '@/types/api'

const SOURCE_COLOR_MAP: Record<string, string> = {
  kabum: '#538dff',
  pichau: '#d16363',
  terabyteshop: '#36a56d',
  amazon: '#d79243',
  magazineluiza: '#8b6ef6'
}

const SOURCE_FALLBACK_PALETTE = ['#0f766e', '#c2410c', '#7c3aed', '#b91c1c', '#0f766e', '#1d4ed8']

function formatPointLabel(value: string, period: PriceHistoryPeriod) {
  const date = new Date(value)

  if (period === 'month') {
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
  }

  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function resolveSourceColor(sourceName: string, index: number) {
  return SOURCE_COLOR_MAP[sourceName] ?? SOURCE_FALLBACK_PALETTE[index % SOURCE_FALLBACK_PALETTE.length]
}

function buildOverviewPoint(
  item: PriceHistoryMinimumEntry,
  period: PriceHistoryPeriod
): DashboardOverviewSourcePoint {
  return {
    date: item.period_start,
    label: formatPointLabel(item.period_start, period),
    value: Number(item.price),
    capturedAt: item.captured_at,
    canonicalUrl: item.canonical_url,
    sellerName: item.seller_name,
    searchRunId: item.search_run_id,
    productTitle: item.product_title,
    sourceName: item.source_name,
    sourceLabel: item.source_label
  }
}

function buildMinimumItem(entry: PriceHistoryMinimumEntry): DashboardOverviewMinimumItem {
  return {
    periodStart: entry.period_start,
    capturedAt: entry.captured_at,
    productTitle: entry.product_title,
    sourceProductTitle: entry.source_product_title,
    canonicalUrl: entry.canonical_url,
    price: Number(entry.price),
    currency: entry.currency,
    sellerName: entry.seller_name,
    searchRunId: entry.search_run_id,
    sourceName: entry.source_name,
    sourceLabel: entry.source_label
  }
}

function createSourceSeries(
  source: PriceHistoryMinimumsResponse['series'][number],
  period: PriceHistoryPeriod,
  index: number
): DashboardOverviewSourceSeries {
  const points = source.items.map((item) => buildOverviewPoint(item, period))
  const currentValue = points.at(-1)?.value ?? null
  const previousValue = points.length > 1 ? (points.at(-2)?.value ?? null) : null
  const values = points.map((point) => point.value)
  const minimumEntry = source.items.reduce<PriceHistoryMinimumEntry | null>((currentMinimum, item) => {
    if (!currentMinimum) {
      return item
    }

    return Number(item.price) < Number(currentMinimum.price) ? item : currentMinimum
  }, null)

  return {
    sourceName: source.source_name,
    sourceLabel: source.source_label,
    colorToken: resolveSourceColor(source.source_name, index),
    currentValue,
    previousValue,
    deltaPercent:
      currentValue !== null && previousValue !== null && previousValue !== 0
        ? ((currentValue - previousValue) / previousValue) * 100
        : null,
    lowValue: values.length ? Math.min(...values) : null,
    highValue: values.length ? Math.max(...values) : null,
    latestCapturedAt: points.at(-1)?.capturedAt ?? null,
    minimumItem: minimumEntry ? buildMinimumItem(minimumEntry) : null,
    points
  }
}

function createEmptySeries(
  product: TrackedProduct,
  period: PriceHistoryPeriod,
  startAt: string,
  endAt: string,
  sourceFilter: DashboardOverviewSourceFilterValue
): DashboardOverviewSeries {
  return {
    productId: product.id,
    productTitle: product.product_title,
    currency: 'BRL',
    period,
    startAt,
    endAt,
    sourceFilter,
    summarySourceName: null,
    summarySourceLabel: null,
    visibleSourceCount: 0,
    currentValue: null,
    previousValue: null,
    deltaPercent: null,
    lowValue: null,
    highValue: null,
    latestCapturedAt: null,
    minimumItem: null,
    sources: []
  }
}

function pickSummarySource(sources: DashboardOverviewSourceSeries[]) {
  return sources.reduce<DashboardOverviewSourceSeries | null>((lowestCurrentSeries, source) => {
    if (source.currentValue === null) {
      return lowestCurrentSeries
    }

    if (!lowestCurrentSeries || lowestCurrentSeries.currentValue === null) {
      return source
    }

    return source.currentValue < lowestCurrentSeries.currentValue ? source : lowestCurrentSeries
  }, null)
}

function createSeriesFromPayload(
  product: TrackedProduct,
  payload: PriceHistoryMinimumsResponse,
  requestedSource: DashboardOverviewSourceFilterValue
): DashboardOverviewSeries {
  const sources = payload.series.map((series, index) => createSourceSeries(series, payload.granularity, index))
  const summarySource = pickSummarySource(sources)
  const allValues = sources.flatMap((source) => source.points.map((point) => point.value))
  const allMinimumItems = sources
    .map((source) => source.minimumItem)
    .filter((item): item is DashboardOverviewMinimumItem => item !== null)
  const minimumItem = allMinimumItems.reduce<DashboardOverviewMinimumItem | null>((currentMinimum, item) => {
    if (!currentMinimum) {
      return item
    }

    return item.price < currentMinimum.price ? item : currentMinimum
  }, null)

  return {
    productId: payload.product_id,
    productTitle: payload.product_title || minimumItem?.productTitle || product.product_title,
    currency: minimumItem?.currency ?? summarySource?.minimumItem?.currency ?? 'BRL',
    period: payload.granularity,
    startAt: payload.start_at,
    endAt: payload.end_at,
    sourceFilter: requestedSource,
    summarySourceName: summarySource?.sourceName ?? null,
    summarySourceLabel: summarySource?.sourceLabel ?? null,
    visibleSourceCount: sources.length,
    currentValue: summarySource?.currentValue ?? null,
    previousValue: summarySource?.previousValue ?? null,
    deltaPercent: summarySource?.deltaPercent ?? null,
    lowValue: allValues.length ? Math.min(...allValues) : null,
    highValue: allValues.length ? Math.max(...allValues) : null,
    latestCapturedAt: summarySource?.latestCapturedAt ?? null,
    minimumItem,
    sources
  }
}

function toUtcDateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

function shiftUtcDays(value: Date, amount: number) {
  const shifted = new Date(value)
  shifted.setUTCDate(shifted.getUTCDate() + amount)
  return shifted
}

function shiftUtcMonths(value: Date, amount: number) {
  const year = value.getUTCFullYear()
  const monthIndex = value.getUTCMonth() + amount
  const day = value.getUTCDate()
  const shifted = new Date(Date.UTC(year, monthIndex, 1))
  const lastDayOfTargetMonth = new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0)
  ).getUTCDate()

  shifted.setUTCDate(Math.min(day, lastDayOfTargetMonth))

  return shifted
}

function buildOverviewQuery(range: DashboardOverviewRange) {
  const today = new Date()

  if (range === '7d') {
    return {
      startAt: toUtcDateOnly(shiftUtcDays(today, -6)),
      endAt: toUtcDateOnly(today)
    }
  }

  if (range === '30d') {
    return {
      startAt: toUtcDateOnly(shiftUtcDays(today, -29)),
      endAt: toUtcDateOnly(today)
    }
  }

  if (range === '90d') {
    return {
      startAt: toUtcDateOnly(shiftUtcDays(today, -89)),
      endAt: toUtcDateOnly(today)
    }
  }

  if (range === '6m') {
    return {
      startAt: toUtcDateOnly(shiftUtcMonths(today, -6)),
      endAt: toUtcDateOnly(today)
    }
  }

  return {
    startAt: toUtcDateOnly(shiftUtcMonths(today, -12)),
    endAt: toUtcDateOnly(today)
  }
}

export function useDashboardOverview() {
  const seriesCollection = ref<DashboardOverviewSeries[]>([])
  const loading = shallowRef(false)
  const errorMessage = shallowRef<string | null>(null)
  let activeRequestId = 0

  async function loadSeries(
    products: TrackedProduct[],
    range: DashboardOverviewRange,
    granularity: DashboardOverviewGranularity,
    source = ALL_SOURCES_FILTER
  ) {
    const requestId = ++activeRequestId

    if (!products.length) {
      seriesCollection.value = []
      errorMessage.value = null
      loading.value = false
      return
    }

    loading.value = true
    errorMessage.value = null

    const query = buildOverviewQuery(range)
    const results = await Promise.allSettled(
      products.map(async (product) => {
        const payload = await fetchPriceHistoryMinimums({
          productId: product.id,
          granularity,
          startAt: query.startAt,
          endAt: query.endAt,
          source
        })

        const visibleSeries =
          source === ALL_SOURCES_FILTER
            ? payload.series
            : payload.series.filter((entry) => entry.source_name === source)

        return createSeriesFromPayload(product, { ...payload, series: visibleSeries }, source)
      })
    )

    if (requestId !== activeRequestId) {
      return
    }

    let nextErrorMessage: string | null = null
    seriesCollection.value = results.map((result, index) => {
      const product = products[index]

      if (result.status === 'fulfilled') {
        return result.value
      }

      if (!nextErrorMessage) {
        nextErrorMessage =
          result.reason instanceof Error
            ? result.reason.message
            : 'Failed to load overview price history.'
      }

      return createEmptySeries(product, granularity, query.startAt, query.endAt, source)
    })
    errorMessage.value = nextErrorMessage
    loading.value = false
  }

  return {
    seriesCollection,
    loading,
    errorMessage,
    loadSeries
  }
}
