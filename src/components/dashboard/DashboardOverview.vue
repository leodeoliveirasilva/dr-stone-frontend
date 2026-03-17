<script setup lang="ts">
import { computed } from 'vue'

import { formatCompactNumber, formatCurrency, formatPercent, formatDate, formatDateTime } from '@/lib/formatters'
import { ALL_SOURCES_FILTER } from '@/composables/useDrStoneApi'
import type { SourceOption, TrackedProduct } from '@/types/api'

import DashboardProductSelect from './DashboardProductSelect.vue'
import DashboardTrendChart from './DashboardTrendChart.vue'
import type {
  DashboardOverviewGranularity,
  DashboardOverviewRange,
  DashboardOverviewSeries,
  DashboardOverviewSourceFilterValue
} from './dashboard.types'

const props = defineProps<{
  products: TrackedProduct[]
  sourceOptions: SourceOption[]
  sourcesLoading: boolean
  runsToday: number
  activeProducts: number
  successRate: number
  loading: boolean
  errorMessage: string | null
  selectedProductId: string | null
  selectedGranularity: DashboardOverviewGranularity
  selectedRange: DashboardOverviewRange
  selectedSource: DashboardOverviewSourceFilterValue
  seriesCollection: DashboardOverviewSeries[]
  selectedSeries: DashboardOverviewSeries | null
}>()

const emit = defineEmits<{
  selectProduct: [productId: string]
  selectGranularity: [granularity: DashboardOverviewGranularity]
  selectRange: [range: DashboardOverviewRange]
  selectSource: [source: DashboardOverviewSourceFilterValue]
}>()

const rangeOptions: DashboardOverviewRange[] = ['7d', '30d', '90d', '6m', '1y']
const granularityOptions: Array<{ value: DashboardOverviewGranularity; label: string }> = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' }
]

const spotlightProducts = computed(() =>
  [...props.seriesCollection]
    .filter((series) => series.minimumItem !== null)
    .sort((left, right) => left.minimumItem!.price - right.minimumItem!.price)
    .slice(0, 4)
)

const isAllSourcesSelected = computed(() => props.selectedSource === ALL_SOURCES_FILTER)

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

const selectedSeriesCurrentDetail = computed(() => {
  if (!props.selectedSeries?.latestCapturedAt) {
    return 'Select a product with saved prices'
  }

  if (isAllSourcesSelected.value && props.selectedSeries.summarySourceLabel) {
    return `Cheapest latest visible source: ${props.selectedSeries.summarySourceLabel} • Captured ${formatDate(props.selectedSeries.latestCapturedAt)}`
  }

  return `Captured ${formatDate(props.selectedSeries.latestCapturedAt)}`
})

const selectedSeriesSummaryHint = computed(() => {
  if (!props.selectedSeries) {
    return 'Pick a product to inspect its per-source minimums.'
  }

  if (!isAllSourcesSelected.value) {
    return 'Summary cards reflect the selected source only.'
  }

  if (!props.selectedSeries.visibleSourceCount) {
    return 'No visible sources returned data for the selected range.'
  }

  if (props.selectedSeries.visibleSourceCount === 1) {
    return `Only ${props.selectedSeries.summarySourceLabel ?? 'one source'} returned data in this range.`
  }

  return `Summary cards use ${props.selectedSeries.summarySourceLabel ?? 'the cheapest latest visible source'} while the chart shows all visible source lines.`
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
    label: isAllSourcesSelected.value ? 'Latest visible low' : 'Latest low price',
    value: selectedSeriesCurrentValue.value,
    detail: selectedSeriesCurrentDetail.value,
    tone: 'accent'
  }
])

function handleGranularityChange(event: Event) {
  emit('selectGranularity', (event.target as HTMLSelectElement).value as DashboardOverviewGranularity)
}

function handleSourceChange(event: Event) {
  emit('selectSource', (event.target as HTMLSelectElement).value as DashboardOverviewSourceFilterValue)
}
</script>

<template>
  <section class="view-stack">
    <header class="view-header">
      <div>
        <p class="section-kicker">Overview</p>
        <h2 class="view-title">Price intelligence at a glance</h2>
        <p class="view-copy">
          The overview uses saved minimum prices grouped by the selected granularity, with one line per source when all sources are visible.
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
            <p class="surface-note surface-note--inline">
              {{ selectedSeriesSummaryHint }}
            </p>
          </div>

          <div class="surface-head__controls">
            <DashboardProductSelect
              :products="products"
              :selected-product-id="selectedProductId"
              @select-product="emit('selectProduct', $event)"
            />

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

            <label class="chart-filter">
              <span class="chart-filter__label">Source</span>
              <select
                class="chart-filter__select"
                :value="selectedSource"
                :disabled="sourcesLoading"
                aria-label="Select visible source"
                @change="handleSourceChange"
              >
                <option
                  v-for="option in sourceOptions"
                  :key="option.source_name"
                  :value="option.source_name"
                >
                  {{ option.source_label }}
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
            <p class="chart-summary__label">
              {{ isAllSourcesSelected ? 'Latest visible low' : 'Latest bucket low' }}
            </p>
            <p class="chart-summary__value">{{ selectedSeriesCurrentValue }}</p>
          </div>
          <div>
            <p class="chart-summary__label">
              {{ isAllSourcesSelected ? 'Cheapest source move' : 'Previous bucket move' }}
            </p>
            <p class="chart-summary__value chart-summary__value--small">{{ selectedSeriesDelta }}</p>
          </div>
          <div>
            <p class="chart-summary__label">
              {{ isAllSourcesSelected ? 'Visible range' : 'Requested range' }}
            </p>
            <p class="chart-summary__value chart-summary__value--small">{{ selectedSeriesRange }}</p>
          </div>
        </div>

        <p v-if="loading" class="surface-note">Loading minimum prices...</p>
        <p v-else-if="errorMessage" class="surface-note surface-note--error">{{ errorMessage }}</p>
        <p v-else-if="selectedSeries && !selectedSeries.sources.length" class="surface-note">
          No saved prices were found for this product in the selected range.
        </p>

        <DashboardTrendChart :series="selectedSeries?.sources ?? []" />
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
                {{ series.minimumItem!.sourceLabel }} ·
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
