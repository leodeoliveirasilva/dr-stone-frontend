import { computed, ref, shallowRef } from 'vue'

import { apiRequest } from '@/lib/api-client'
import type {
  CollectResult,
  LegacyPriceHistoryMinimumEntryResponse,
  LegacyPriceHistoryMinimumsResponse,
  LegacyProductHistoryEntryResponse,
  LegacyTrackedProductResponse,
  PriceHistoryMinimumsResponse,
  PriceHistoryPeriod,
  ProductHistoryEntry,
  SearchRunsResponse,
  TrackedProduct,
  UpsertTrackedProductPayload
} from '@/types/api'

function normalizeTrackedProduct(product: LegacyTrackedProductResponse): TrackedProduct {
  const searchTerms = Array.isArray(product.search_terms)
    ? product.search_terms.filter(Boolean)
    : product.search_term
      ? [product.search_term]
      : []
  const productTitle = product.product_title ?? product.title ?? ''

  return {
    id: product.id,
    product_title: productTitle,
    search_terms: searchTerms,
    active: Boolean(product.active),
    created_at: product.created_at,
    updated_at: product.updated_at
  }
}

function normalizeHistoryEntry(entry: LegacyProductHistoryEntryResponse): ProductHistoryEntry {
  return {
    captured_at: entry.captured_at,
    product_title: entry.product_title,
    canonical_url: entry.canonical_url,
    price: entry.price ?? entry.price_value ?? '0',
    currency: entry.currency,
    seller_name: entry.seller_name,
    search_run_id: entry.search_run_id
  }
}

function normalizePriceHistoryMinimumEntry(entry: LegacyPriceHistoryMinimumEntryResponse) {
  return {
    ...normalizeHistoryEntry(entry),
    period_start: entry.period_start
  }
}

export async function fetchPriceHistoryMinimums(params: {
  productId: string
  period: PriceHistoryPeriod
  startAt: string
  endAt: string
}) {
  const searchParams = new URLSearchParams({
    product_id: params.productId,
    period: params.period,
    start_at: params.startAt,
    end_at: params.endAt
  })
  const response = await apiRequest<LegacyPriceHistoryMinimumsResponse>(
    `/price-history/minimums?${searchParams.toString()}`
  )

  return {
    product_id: response.product_id,
    period: response.period,
    start_at: response.start_at,
    end_at: response.end_at,
    items: response.items.map(normalizePriceHistoryMinimumEntry)
  } satisfies PriceHistoryMinimumsResponse
}

export function useDrStoneApi() {
  const products = ref<TrackedProduct[]>([])
  const runs = ref<SearchRunsResponse['runs']>([])
  const selectedProductId = shallowRef<string | null>(null)
  const historyRows = ref<ProductHistoryEntry[]>([])

  const productsLoading = shallowRef(false)
  const runsLoading = shallowRef(false)
  const historyLoading = shallowRef(false)
  const actionLoadingId = shallowRef<string | null>(null)

  const statusMessage = shallowRef('Ready.')
  const statusError = shallowRef(false)

  const selectedProduct = computed(() =>
    products.value.find((entry) => entry.id === selectedProductId.value) ?? null
  )

  function setStatus(message: string, isError = false) {
    statusMessage.value = message
    statusError.value = isError
  }

  async function refreshProducts(includeInactive = true) {
    productsLoading.value = true
    setStatus('Loading tracked products...')
    try {
      const query = includeInactive ? '?all=1' : ''
      const response = await apiRequest<LegacyTrackedProductResponse[]>(`/tracked-products${query}`)
      products.value = response.map(normalizeTrackedProduct)
      setStatus(`Loaded ${products.value.length} tracked product(s).`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load tracked products.'
      setStatus(message, true)
      throw error
    } finally {
      productsLoading.value = false
    }
  }

  async function refreshRuns(date: string, limit = 40) {
    runsLoading.value = true
    setStatus('Loading search runs...')
    try {
      const payload = await apiRequest<SearchRunsResponse>(
        `/search-runs?date=${encodeURIComponent(date)}&limit=${limit}`
      )
      runs.value = payload.runs
      setStatus(`Loaded ${payload.runs.length} search run(s) for ${date}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load search runs.'
      setStatus(message, true)
      throw error
    } finally {
      runsLoading.value = false
    }
  }

  async function loadHistory(trackedProductId: string, limit = 120) {
    historyLoading.value = true
    selectedProductId.value = trackedProductId
    setStatus('Loading product history...')
    try {
      const response = await apiRequest<LegacyProductHistoryEntryResponse[]>(
        `/tracked-products/${trackedProductId}/history?limit=${limit}`
      )
      historyRows.value = response.map(normalizeHistoryEntry)
      setStatus(`Loaded ${historyRows.value.length} history row(s).`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load history.'
      setStatus(message, true)
      throw error
    } finally {
      historyLoading.value = false
    }
  }

  async function createProduct(payload: UpsertTrackedProductPayload) {
    setStatus('Creating tracked product...')
    await apiRequest<TrackedProduct>('/tracked-products', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        search_term: payload.search_terms[0] ?? ''
      })
    })
    await refreshProducts(true)
  }

  async function updateProduct(productId: string, payload: UpsertTrackedProductPayload) {
    setStatus('Updating tracked product...')
    await apiRequest<TrackedProduct>(`/tracked-products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        search_term: payload.search_terms[0] ?? ''
      })
    })
    await refreshProducts(true)
  }

  async function deleteProduct(productId: string) {
    actionLoadingId.value = productId
    setStatus('Deleting tracked product...')
    try {
      await apiRequest<void>(`/tracked-products/${productId}`, {
        method: 'DELETE'
      })
      if (selectedProductId.value === productId) {
        selectedProductId.value = null
        historyRows.value = []
      }
      await refreshProducts(true)
    } finally {
      actionLoadingId.value = null
    }
  }

  async function collectNow(productId: string): Promise<CollectResult> {
    actionLoadingId.value = productId
    setStatus('Running manual collection...')
    try {
      const result = await apiRequest<CollectResult>(`/tracked-products/${productId}?action=collect`, {
        method: 'POST'
      })
      await refreshRuns(new Date().toISOString().slice(0, 10))
      setStatus(
        `Manual collection finished: ${result.successful_runs} source run(s) succeeded, ${result.failed_runs} failed.`
      )
      return result
    } finally {
      actionLoadingId.value = null
    }
  }

  return {
    products,
    runs,
    historyRows,
    selectedProduct,
    selectedProductId,
    productsLoading,
    runsLoading,
    historyLoading,
    actionLoadingId,
    statusMessage,
    statusError,
    refreshProducts,
    refreshRuns,
    loadHistory,
    createProduct,
    updateProduct,
    deleteProduct,
    collectNow
  }
}
