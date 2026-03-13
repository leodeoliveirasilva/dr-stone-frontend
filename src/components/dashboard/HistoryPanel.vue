<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { formatCurrency, formatDateTime } from '@/lib/formatters'
import type { ProductHistoryEntry, TrackedProduct } from '@/types/api'

const props = defineProps<{
  product: TrackedProduct | null
  rows: ProductHistoryEntry[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
}>()

const emit = defineEmits<{
  loadMore: []
}>()

const sentinelRef = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

function observeSentinel() {
  if (!observer || !sentinelRef.value) {
    return
  }
  observer.disconnect()
  observer.observe(sentinelRef.value)
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) {
        return
      }
      if (props.loading || props.loadingMore || !props.hasMore) {
        return
      }
      emit('loadMore')
    },
    { rootMargin: '0px 0px 240px 0px' }
  )
  observeSentinel()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

watch(sentinelRef, () => {
  observeSentinel()
})
</script>

<template>
  <div class="panel-block panel-block--embedded">
    <div class="panel-header-row">
      <h2 class="panel-title">Price History</h2>
      <span class="panel-chip">{{ rows.length }}</span>
    </div>
    <p class="panel-copy">
      <template v-if="product">{{ product.product_title }}</template>
      <template v-else>Select a tracked product to inspect history.</template>
    </p>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Captured</th>
            <th>Product</th>
            <th>Price</th>
            <th>Seller</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="empty-cell">Loading history...</td>
          </tr>
          <tr v-else-if="!rows.length">
            <td colspan="5" class="empty-cell">No history available for the selected product.</td>
          </tr>
          <tr v-for="row in rows" :key="`${row.search_run_id}-${row.captured_at}-${row.canonical_url}`">
            <td data-label="Captured">{{ formatDateTime(row.captured_at) }}</td>
            <td data-label="Product">{{ row.product_title }}</td>
            <td data-label="Price">{{ formatCurrency(Number(row.price), row.currency) }}</td>
            <td data-label="Seller">{{ row.seller_name || 'unknown' }}</td>
            <td data-label="Link">
              <a class="table-link" :href="row.canonical_url" rel="noreferrer" target="_blank">open</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="rows.length" ref="sentinelRef" class="history-sentinel">
      <span v-if="loadingMore" class="surface-note">Loading more history...</span>
      <span v-else-if="hasMore" class="surface-note">Scroll to load more.</span>
      <span v-else class="surface-note">You reached the end of the selected history window.</span>
    </div>
  </div>
</template>
