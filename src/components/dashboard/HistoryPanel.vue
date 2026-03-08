<script setup lang="ts">
import type { ProductHistoryEntry, TrackedProduct } from '@/types/api'

defineProps<{
  product: TrackedProduct | null
  rows: ProductHistoryEntry[]
  loading: boolean
}>()
</script>

<template>
  <div class="panel-block">
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
            <th>Price</th>
            <th>Seller</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="empty-cell">Loading history...</td>
          </tr>
          <tr v-else-if="!rows.length">
            <td colspan="4" class="empty-cell">No history available for the selected product.</td>
          </tr>
          <tr v-for="row in rows" :key="`${row.search_run_id}-${row.captured_at}-${row.canonical_url}`">
            <td>{{ new Date(row.captured_at).toLocaleString() }}</td>
            <td>{{ row.currency }} {{ row.price }}</td>
            <td>{{ row.seller_name || 'unknown' }}</td>
            <td>
              <a class="table-link" :href="row.canonical_url" rel="noreferrer" target="_blank">open</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
