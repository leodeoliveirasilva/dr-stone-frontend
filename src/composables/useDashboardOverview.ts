import { ref, shallowRef } from 'vue'

import { fetchPriceHistoryMinimums } from '@/composables/useDrStoneApi'
import type {
  DashboardOverviewMinimumItem,
  DashboardOverviewPoint,
  DashboardOverviewRange,
  DashboardOverviewSeries
} from '@/components/dashboard/dashboard.types'
import type { PriceHistoryMinimumsResponse, PriceHistoryPeriod, TrackedProduct } from '@/types/api'

function formatPointLabel(value: string, period: PriceHistoryPeriod) {
  const date = new Date(value)

  if (period === 'month') {
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
  }

  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function buildOverviewPoints(payload: PriceHistoryMinimumsResponse): DashboardOverviewPoint[] {
  return payload.items.map((item) => ({
    date: item.period_start,
    label: formatPointLabel(item.period_start, payload.period),
    value: Number(item.price),
    capturedAt: item.captured_at,
    canonicalUrl: item.canonical_url,
    sellerName: item.seller_name,
    searchRunId: item.search_run_id
  }))
}

function createEmptySeries(
  product: TrackedProduct,
  period: PriceHistoryPeriod,
  startAt: string,
  endAt: string
): DashboardOverviewSeries {
  return {
    productId: product.id,
    productTitle: product.product_title,
    currency: 'BRL',
    period,
    startAt,
    endAt,
    currentValue: null,
    previousValue: null,
    deltaPercent: null,
    lowValue: null,
    highValue: null,
    latestCapturedAt: null,
    minimumItem: null,
    points: []
  }
}

function buildMinimumItem(payload: PriceHistoryMinimumsResponse): DashboardOverviewMinimumItem | null {
  const minimumEntry = payload.items.reduce<PriceHistoryMinimumsResponse['items'][number] | null>(
    (currentMinimum, item) => {
      if (!currentMinimum) {
        return item
      }

      return Number(item.price) < Number(currentMinimum.price) ? item : currentMinimum
    },
    null
  )

  if (!minimumEntry) {
    return null
  }

  return {
    periodStart: minimumEntry.period_start,
    capturedAt: minimumEntry.captured_at,
    productTitle: minimumEntry.product_title,
    canonicalUrl: minimumEntry.canonical_url,
    price: Number(minimumEntry.price),
    currency: minimumEntry.currency,
    sellerName: minimumEntry.seller_name,
    searchRunId: minimumEntry.search_run_id
  }
}

function createSeriesFromPayload(
  product: TrackedProduct,
  payload: PriceHistoryMinimumsResponse
): DashboardOverviewSeries {
  const points = buildOverviewPoints(payload)
  const currentValue = points.at(-1)?.value ?? null
  const previousValue = points.length > 1 ? (points.at(-2)?.value ?? null) : null
  const values = points.map((point) => point.value)
  const latestItem = payload.items.at(-1) ?? null

  return {
    productId: payload.product_id,
    productTitle: latestItem?.product_title ?? product.product_title,
    currency: latestItem?.currency ?? 'BRL',
    period: payload.period,
    startAt: payload.start_at,
    endAt: payload.end_at,
    currentValue,
    previousValue,
    deltaPercent:
      currentValue !== null && previousValue !== null && previousValue !== 0
        ? ((currentValue - previousValue) / previousValue) * 100
        : null,
    lowValue: values.length ? Math.min(...values) : null,
    highValue: values.length ? Math.max(...values) : null,
    latestCapturedAt: latestItem?.captured_at ?? null,
    minimumItem: buildMinimumItem(payload),
    points
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
      period: 'day' as const,
      startAt: toUtcDateOnly(shiftUtcDays(today, -6)),
      endAt: toUtcDateOnly(today)
    }
  }

  if (range === '30d') {
    return {
      period: 'day' as const,
      startAt: toUtcDateOnly(shiftUtcDays(today, -29)),
      endAt: toUtcDateOnly(today)
    }
  }

  if (range === '90d') {
    return {
      period: 'week' as const,
      startAt: toUtcDateOnly(shiftUtcDays(today, -89)),
      endAt: toUtcDateOnly(today)
    }
  }

  if (range === '6m') {
    return {
      period: 'week' as const,
      startAt: toUtcDateOnly(shiftUtcMonths(today, -6)),
      endAt: toUtcDateOnly(today)
    }
  }

  return {
    period: 'month' as const,
    startAt: toUtcDateOnly(shiftUtcMonths(today, -12)),
    endAt: toUtcDateOnly(today)
  }
}

export function useDashboardOverview() {
  const seriesCollection = ref<DashboardOverviewSeries[]>([])
  const loading = shallowRef(false)
  const errorMessage = shallowRef<string | null>(null)
  let activeRequestId = 0

  async function loadSeries(products: TrackedProduct[], range: DashboardOverviewRange) {
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
          period: query.period,
          startAt: query.startAt,
          endAt: query.endAt
        })

        return createSeriesFromPayload(product, payload)
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

      return createEmptySeries(product, query.period, query.startAt, query.endAt)
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
