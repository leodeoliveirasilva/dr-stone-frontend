<script setup lang="ts">
import { computed } from 'vue'

import type { TrackedProduct, UpsertTrackedProductPayload } from '@/types/api'

import ProductForm from './ProductForm.vue'
import ProductsTable from './ProductsTable.vue'

const props = defineProps<{
  products: TrackedProduct[]
  editingProduct: TrackedProduct | null
  productsLoading: boolean
  actionLoadingId: string | null
  selectedProductId: string | null
}>()

const emit = defineEmits<{
  submit: [payload: UpsertTrackedProductPayload]
  cancelEdit: []
  edit: [productId: string]
  history: [productId: string]
  collect: [productId: string]
  remove: [productId: string]
}>()

const activeCount = computed(() => props.products.filter((product) => Boolean(product.active)).length)
</script>

<template>
  <section class="view-stack">
    <header class="view-header">
      <div>
        <p class="section-kicker">Products</p>
        <h2 class="view-title">Manage tracked products</h2>
        <p class="view-copy">
          Create, edit, collect, and review the products being monitored across all scraping sources.
        </p>
      </div>

      <div class="header-pills">
        <span class="header-pill">{{ activeCount }} active</span>
        <span class="header-pill">{{ products.length - activeCount }} inactive</span>
      </div>
    </header>

    <section class="content-grid content-grid--products">
      <article class="surface">
        <ProductForm
          :busy="productsLoading"
          :product="editingProduct"
          @cancel="emit('cancelEdit')"
          @submit="emit('submit', $event)"
        />
      </article>

      <article class="surface">
        <ProductsTable
          :busy-id="actionLoadingId"
          :products="products"
          :selected-product-id="selectedProductId"
          @collect="emit('collect', $event)"
          @edit="emit('edit', $event)"
          @history="emit('history', $event)"
          @remove="emit('remove', $event)"
        />
      </article>
    </section>
  </section>
</template>
