<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { formatDate } from '@/lib/formatters'
import type { ProductHistoryEntry, TrackedProduct } from '@/types/api'

import DashboardProductSelect from './DashboardProductSelect.vue'
import HistoryPanel from './HistoryPanel.vue'

const props = defineProps<{
  products: TrackedProduct[]
  selectedProductId: string | null
  selectedProduct: TrackedProduct | null
  rangeStartAt: string | null
  rangeEndAt: string | null
  rows: ProductHistoryEntry[]
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
}>()

const emit = defineEmits<{
  loadMore: []
  rangeChange: [range: { startAt: string | null; endAt: string | null }]
  selectProduct: [productId: string]
}>()

const latestCapturedAt = computed(() => props.rows[0]?.captured_at ?? null)
const startDate = ref(props.rangeStartAt ?? '')
const endDate = ref(props.rangeEndAt ?? '')

watch(
  () => [props.rangeStartAt, props.rangeEndAt],
  ([nextStartAt, nextEndAt]) => {
    startDate.value = nextStartAt ?? ''
    endDate.value = nextEndAt ?? ''
  }
)

function applyRange() {
  emit('rangeChange', {
    startAt: startDate.value || null,
    endAt: endDate.value || null
  })
}

function clearRange() {
  startDate.value = ''
  endDate.value = ''
  emit('rangeChange', { startAt: null, endAt: null })
}
</script>

<template>
  <section class="view-stack">
    <header class="view-header">
      <div>
        <p class="section-kicker">History</p>
        <h2 class="view-title">Inspect captured prices</h2>
        <p class="view-copy">
          Choose a tracked product and date window from the filters to load its captured price timeline and source links.
        </p>
      </div>

      <div v-if="latestCapturedAt" class="header-pills">
        <span class="header-pill">Latest capture {{ formatDate(latestCapturedAt) }}</span>
      </div>
    </header>

    <article class="surface">
      <div class="panel-header-row panel-header-row--history-filters">
        <div>
          <h2 class="panel-title">Filters</h2>
          <p class="panel-copy">Default view starts with the last 30 days. Clear the range to load all history.</p>
        </div>

        <div class="history-filter-bar">
          <DashboardProductSelect
            :products="products"
            :selected-product-id="selectedProductId"
            aria-label="Select history product"
            @select-product="emit('selectProduct', $event)"
          />

          <label class="chart-filter">
            <span class="chart-filter__label">Start date</span>
            <input
              v-model="startDate"
              class="chart-filter__input"
              type="date"
              aria-label="History start date"
            />
          </label>

          <label class="chart-filter">
            <span class="chart-filter__label">End date</span>
            <input
              v-model="endDate"
              class="chart-filter__input"
              type="date"
              aria-label="History end date"
            />
          </label>

          <div class="history-filter-actions">
            <button class="btn btn-solid btn-mini" type="button" @click="applyRange">Apply</button>
            <button class="btn btn-ghost btn-mini" type="button" @click="clearRange">All time</button>
          </div>
        </div>
      </div>

      <HistoryPanel
        :has-more="hasMore"
        :loading="loading"
        :loading-more="loadingMore"
        :product="selectedProduct"
        :rows="rows"
        @load-more="emit('loadMore')"
      />
    </article>
  </section>
</template>
