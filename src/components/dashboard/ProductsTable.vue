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
  <div class="panel-block panel-block--embedded">
    <div class="panel-header-row">
      <h2 class="panel-title">Tracked Products</h2>
      <span class="panel-chip">{{ products.length }}</span>
    </div>
    <p class="panel-copy">Catalog state from `GET /tracked-products?all=1`. Collection cadence is global.</p>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Search Terms</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!products.length">
            <td colspan="4" class="empty-cell">No products tracked yet.</td>
          </tr>
          <tr
            v-for="product in products"
            :key="product.id"
            :class="{ 'row-selected': product.id === selectedProductId }"
          >
            <td data-label="Title">{{ product.product_title }}</td>
            <td data-label="Search Terms">
              <div class="terms-stack">
                <span v-for="term in product.search_terms" :key="`${product.id}-${term}`" class="term-pill">
                  {{ term }}
                </span>
              </div>
            </td>
            <td data-label="Status">
              <span :class="Boolean(product.active) ? 'badge-active' : 'badge-paused'">
                {{ Boolean(product.active) ? 'active' : 'inactive' }}
              </span>
            </td>
            <td data-label="Actions">
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
