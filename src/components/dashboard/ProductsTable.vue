<script setup lang="ts">
import type { TrackedProduct } from '@/types/api'

defineProps<{
  products: TrackedProduct[]
  selectedProductId: string | null
  busyId: string | null
}>()

const emit = defineEmits<{
  edit: [productId: string]
  history: [productId: string]
  collect: [productId: string]
  remove: [productId: string]
}>()
</script>

<template>
  <div class="panel-block">
    <div class="panel-header-row">
      <h2 class="panel-title">Tracked Products</h2>
      <span class="panel-chip">{{ products.length }}</span>
    </div>
    <p class="panel-copy">Catalog state from `GET /tracked-products?all=1`.</p>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Search Term</th>
            <th>Scrapes/Day</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!products.length">
            <td colspan="5" class="empty-cell">No products tracked yet.</td>
          </tr>
          <tr
            v-for="product in products"
            :key="product.id"
            :class="{ 'row-selected': product.id === selectedProductId }"
          >
            <td>{{ product.product_title }}</td>
            <td>{{ product.search_term }}</td>
            <td>{{ product.scrapes_per_day }}</td>
            <td>
              <span :class="Boolean(product.active) ? 'badge-active' : 'badge-paused'">
                {{ Boolean(product.active) ? 'active' : 'inactive' }}
              </span>
            </td>
            <td>
              <div class="table-actions">
                <button class="btn btn-mini" type="button" @click="emit('edit', product.id)">Edit</button>
                <button class="btn btn-mini" type="button" @click="emit('history', product.id)">History</button>
                <button
                  class="btn btn-mini"
                  type="button"
                  :disabled="busyId === product.id"
                  @click="emit('collect', product.id)"
                >
                  Collect
                </button>
                <button
                  class="btn btn-mini btn-danger"
                  type="button"
                  :disabled="busyId === product.id"
                  @click="emit('remove', product.id)"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
