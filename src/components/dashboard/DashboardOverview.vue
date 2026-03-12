<script setup lang="ts">
import { computed } from 'vue'

import { formatCompactNumber, formatCurrency, formatPercent, formatDate, formatDateTime } from '@/lib/formatters'
import type { TrackedProduct } from '@/types/api'

import DashboardTrendChart from './DashboardTrendChart.vue'
import type {
  DashboardOverviewGranularity,
  DashboardOverviewRange,
  DashboardOverviewSeries
} from './dashboard.types'

const props = defineProps<{
  products: TrackedProduct[]
  runsToday: number
  activeProducts: number
  successRate: number
  loading: boolean
  errorMessage: string | null
  selectedProductId: string | null
  selectedGranularity: DashboardOverviewGranularity
  selectedRange: DashboardOverviewRange
  seriesCollection: DashboardOverviewSeries[]
  selectedSeries: DashboardOverviewSeries | null
}>()

const emit = defineEmits<{
  selectProduct: [productId: string]
  selectGranularity: [granularity: DashboardOverviewGranularity]
  selectRange: [range: DashboardOverviewRange]
}>()

const rangeOptions: DashboardOverviewRange[] = ['7d', '30d', '90d', '6m', '1y']
const granularityOptions: Array<{ value: DashboardOverviewGranularity; label: string }> = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' }
]

const selectedProductValue = computed(() => props.selectedProductId ?? props.products[0]?.id ?? '')

const spotlightProducts = computed(() =>
  [...props.seriesCollection]
    .filter((series) => series.minimumItem !== null)
    .sort((left, right) => left.minimumItem!.price - right.minimumItem!.price)
    .slice(0, 4)
)

const selectedSeriesCurrentValue = computed(() =>
  props.selectedSeries?.currentValue !== null && props.selectedSeries?.currentValue !== undefined
    ? formatCurrency(props.selectedSeries.currentValue, props.selectedSeries.currency)
    : 'No data'
)

const selectedSeriesDelta = computed(() =>
  props.selectedSeries?.deltaPercent !== null && props.selectedSeries?.deltaPercent !== undefined
    ? formatPercent(props.selectedSeries.deltaPercent / 100)
    : 'No data'
)

const selectedSeriesRange = computed(() => {
  if (
    props.selectedSeries?.lowValue === null ||
    props.selectedSeries?.lowValue === undefined ||
    props.selectedSeries.highValue === null ||
    props.selectedSeries.highValue === undefined
  ) {
    return 'No data'
  }

  return `${formatCurrency(props.selectedSeries.lowValue, props.selectedSeries.currency)} - ${formatCurrency(props.selectedSeries.highValue, props.selectedSeries.currency)}`
})

const overviewCards = computed(() => [
  {
    label: 'Tracked products',
    value: formatCompactNumber(props.products.length),
    detail: `${props.activeProducts} active watchers`,
    tone: 'accent'
  },
  {
    label: 'Runs today',
    value: formatCompactNumber(props.runsToday),
    detail: 'Latest UTC-filtered collection runs',
    tone: 'neutral'
  },
  {
    label: 'Run success',
    value: formatPercent(props.successRate),
    detail: 'Succeeded versus total visible runs',
    tone: 'success'
  },
  {
    label: 'Latest low price',
    value: selectedSeriesCurrentValue.value,
    detail: props.selectedSeries?.latestCapturedAt
      ? `Captured ${formatDate(props.selectedSeries.latestCapturedAt)}`
      : 'Select a product with saved prices',
    tone: 'accent'
  }
])

function handleProductChange(event: Event) {
  const nextProductId = (event.target as HTMLSelectElement).value
  if (nextProductId) {
    emit('selectProduct', nextProductId)
  }
}

function handleGranularityChange(event: Event) {
  emit('selectGranularity', (event.target as HTMLSelectElement).value as DashboardOverviewGranularity)
}
</script>

<template>
  <section class="view-stack">
    <header class="view-header">
      <div>
        <p class="section-kicker">Overview</p>
        <h2 class="view-title">Price intelligence at a glance</h2>
        <p class="view-copy">
          The overview uses saved minimum prices grouped by the selected granularity for each tracked product.
        </p>
      </div>
    </header>

    <section class="overview-grid">
      <article v-for="card in overviewCards" :key="card.label" class="metric-card" :data-tone="card.tone">
        <p class="metric-card__label">{{ card.label }}</p>
        <p class="metric-card__value">{{ card.value }}</p>
        <p class="metric-card__detail">{{ card.detail }}</p>
      </article>
    </section>

    <section class="content-grid content-grid--overview">
      <article class="surface surface--chart">
        <div class="surface-head">
          <div>
            <p class="section-kicker">Price minimums</p>
            <h3 class="surface-title">
              {{ selectedSeries?.productTitle || 'Select a tracked product' }}
            </h3>
          </div>

          <div class="surface-head__controls">
            <label class="chart-filter">
              <span class="chart-filter__label">Product</span>
              <select
                class="chart-filter__select"
                :value="selectedProductValue"
                aria-label="Select tracked product"
                @change="handleProductChange"
              >
                <option v-for="product in products" :key="product.id" :value="product.id">
                  {{ product.product_title }}
                </option>
              </select>
            </label>

            <label class="chart-filter">
              <span class="chart-filter__label">Granularity</span>
              <select
                class="chart-filter__select"
                :value="selectedGranularity"
                aria-label="Select data granularity"
                @change="handleGranularityChange"
              >
                <option
                  v-for="option in granularityOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <div class="range-switcher" aria-label="Time range">
              <button
                v-for="range in rangeOptions"
                :key="range"
                class="range-switcher__button"
                :class="{ 'is-active': selectedRange === range }"
                type="button"
                @click="emit('selectRange', range)"
              >
                {{ range }}
              </button>
            </div>
          </div>
        </div>

        <div class="chart-summary">
          <div>
            <p class="chart-summary__label">Latest bucket low</p>
            <p class="chart-summary__value">{{ selectedSeriesCurrentValue }}</p>
          </div>
          <div>
            <p class="chart-summary__label">Previous bucket move</p>
            <p class="chart-summary__value chart-summary__value--small">{{ selectedSeriesDelta }}</p>
          </div>
          <div>
            <p class="chart-summary__label">Requested range</p>
            <p class="chart-summary__value chart-summary__value--small">{{ selectedSeriesRange }}</p>
          </div>
        </div>

        <p v-if="loading" class="surface-note">Loading minimum prices...</p>
        <p v-else-if="errorMessage" class="surface-note surface-note--error">{{ errorMessage }}</p>
        <p v-else-if="selectedSeries && !selectedSeries.points.length" class="surface-note">
          No saved prices were found for this product in the selected range.
        </p>

        <DashboardTrendChart :points="selectedSeries?.points ?? []" />
      </article>

      <article class="surface surface--rail">
        <div class="surface-head">
          <div>
            <p class="section-kicker">Leaders</p>
            <h3 class="surface-title">Lowest prices in range</h3>
          </div>
        </div>

        <div v-if="spotlightProducts.length" class="spotlight-list">
          <article v-for="series in spotlightProducts" :key="series.productId" class="spotlight-card">
            <div>
              <p class="spotlight-card__title">{{ series.minimumItem!.productTitle }}</p>
              <p class="spotlight-card__meta">
                {{ series.minimumItem!.sellerName || 'unknown seller' }} ·
                {{ formatDateTime(series.minimumItem!.capturedAt) }}
              </p>
              <a
                class="table-link"
                :href="series.minimumItem!.canonicalUrl"
                rel="noreferrer"
                target="_blank"
              >
                open source
              </a>
            </div>
            <div class="spotlight-card__price">
              {{ formatCurrency(series.minimumItem!.price, series.minimumItem!.currency) }}
            </div>
          </article>
        </div>
        <p v-else class="surface-note">No overview prices are available yet.</p>
      </article>
    </section>
  </section>
</template>
