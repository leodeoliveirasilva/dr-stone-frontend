<script setup lang="ts">
import { computed } from 'vue'

import { formatCompactNumber, formatCurrency, formatPercent } from '@/lib/formatters'
import type { MockProductSeries } from '@/lib/dashboard-mocks'
import type { TrackedProduct } from '@/types/api'

import DashboardTrendChart from './DashboardTrendChart.vue'

const props = defineProps<{
  products: TrackedProduct[]
  runsToday: number
  activeProducts: number
  successRate: number
  selectedProductId: string | null
  selectedRange: '7d' | '30d' | '90d'
  seriesCollection: MockProductSeries[]
  selectedSeries: MockProductSeries | null
}>()

const emit = defineEmits<{
  selectProduct: [productId: string]
  selectRange: [range: '7d' | '30d' | '90d']
}>()

const rangeOptions: Array<'7d' | '30d' | '90d'> = ['7d', '30d', '90d']

const spotlightProducts = computed(() =>
  [...props.seriesCollection]
    .sort((left, right) => right.currentValue - left.currentValue)
    .slice(0, 4)
)

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
    label: 'Mock market snapshot',
    value: props.selectedSeries ? formatCurrency(props.selectedSeries.currentValue) : formatCurrency(0),
    detail: props.selectedSeries ? props.selectedSeries.productTitle : 'Select a product to inspect',
    tone: 'accent'
  }
])
</script>

<template>
  <section class="view-stack">
    <header class="view-header">
      <div>
        <p class="section-kicker">Overview</p>
        <h2 class="view-title">Price intelligence at a glance</h2>
        <p class="view-copy">
          The dashboard follows the new shell layout and uses a mocked history dataset until the chart API is ready.
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
            <p class="section-kicker">Mocked chart</p>
            <h3 class="surface-title">
              {{ selectedSeries?.productTitle || 'Select a tracked product' }}
            </h3>
          </div>

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

        <div class="chart-summary">
          <div>
            <p class="chart-summary__label">Current price</p>
            <p class="chart-summary__value">
              {{ selectedSeries ? formatCurrency(selectedSeries.currentValue) : formatCurrency(0) }}
            </p>
          </div>
          <div>
            <p class="chart-summary__label">Day move</p>
            <p class="chart-summary__value chart-summary__value--small">
              {{ selectedSeries ? formatPercent(selectedSeries.deltaPercent / 100) : '0%' }}
            </p>
          </div>
          <div>
            <p class="chart-summary__label">Range</p>
            <p class="chart-summary__value chart-summary__value--small">
              {{
                selectedSeries
                  ? `${formatCurrency(selectedSeries.lowValue)} - ${formatCurrency(selectedSeries.highValue)}`
                  : `${formatCurrency(0)} - ${formatCurrency(0)}`
              }}
            </p>
          </div>
        </div>

        <DashboardTrendChart :points="selectedSeries?.points ?? []" />

        <div class="product-chip-row">
          <button
            v-for="series in seriesCollection"
            :key="series.productId"
            class="product-chip"
            :class="{ 'is-active': selectedProductId === series.productId }"
            type="button"
            @click="emit('selectProduct', series.productId)"
          >
            <span class="product-chip__title">{{ series.productTitle }}</span>
            <span class="product-chip__value">{{ formatCurrency(series.currentValue) }}</span>
          </button>
        </div>
      </article>

      <article class="surface surface--rail">
        <div class="surface-head">
          <div>
            <p class="section-kicker">Leaders</p>
            <h3 class="surface-title">Highest mock prices</h3>
          </div>
        </div>

        <div class="spotlight-list">
          <article v-for="series in spotlightProducts" :key="series.productId" class="spotlight-card">
            <div>
              <p class="spotlight-card__title">{{ series.productTitle }}</p>
              <p class="spotlight-card__meta">{{ formatPercent(series.deltaPercent / 100) }} vs previous point</p>
            </div>
            <div class="spotlight-card__price">{{ formatCurrency(series.currentValue) }}</div>
          </article>
        </div>
      </article>
    </section>
  </section>
</template>
