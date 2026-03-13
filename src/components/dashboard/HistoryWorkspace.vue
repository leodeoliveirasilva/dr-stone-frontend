<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { formatDate } from '@/lib/formatters'
import type { ProductHistoryEntry, TrackedProduct } from '@/types/api'

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
          Select a product from the left rail to load its captured price timeline and source links.
        </p>
      </div>

      <div v-if="latestCapturedAt" class="header-pills">
        <span class="header-pill">Latest capture {{ formatDate(latestCapturedAt) }}</span>
      </div>
    </header>

    <section class="content-grid content-grid--history">
      <aside class="surface surface--selector">
        <div class="surface-head">
          <div>
            <p class="section-kicker">Products</p>
            <h3 class="surface-title">Choose a product</h3>
          </div>
        </div>

        <div class="selector-list">
          <button
            v-for="product in products"
            :key="product.id"
            class="selector-card"
            :class="{ 'is-active': selectedProductId === product.id }"
            type="button"
            @click="emit('selectProduct', product.id)"
          >
            <span class="selector-card__title">{{ product.product_title }}</span>
            <span class="selector-card__meta">{{ product.search_terms.length }} terms</span>
          </button>
        </div>
      </aside>

      <article class="surface">
        <div class="panel-header-row panel-header-row--history-filters">
          <div>
            <h2 class="panel-title">Filters</h2>
            <p class="panel-copy">Default view starts with the last 30 days. Clear the range to load all history.</p>
          </div>

          <div class="history-filter-bar">
            <input v-model="startDate" class="run-filter-input" type="date" aria-label="History start date" />
            <input v-model="endDate" class="run-filter-input" type="date" aria-label="History end date" />
            <button class="btn btn-solid btn-mini" type="button" @click="applyRange">Apply</button>
            <button class="btn btn-ghost btn-mini" type="button" @click="clearRange">All time</button>
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
  </section>
</template>
