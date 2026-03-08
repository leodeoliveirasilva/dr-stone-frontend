<script setup lang="ts">
import { computed } from 'vue'

import { formatDate } from '@/lib/formatters'
import type { ProductHistoryEntry, TrackedProduct } from '@/types/api'

import HistoryPanel from './HistoryPanel.vue'

const props = defineProps<{
  products: TrackedProduct[]
  selectedProductId: string | null
  selectedProduct: TrackedProduct | null
  rows: ProductHistoryEntry[]
  loading: boolean
}>()

const emit = defineEmits<{
  selectProduct: [productId: string]
}>()

const latestCapturedAt = computed(() => props.rows[0]?.captured_at ?? null)
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
        <HistoryPanel :loading="loading" :product="selectedProduct" :rows="rows" />
      </article>
    </section>
  </section>
</template>
