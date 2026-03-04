<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'

import { useDrStoneApi } from '@/composables/useDrStoneApi'
import type { TrackedProduct, UpsertTrackedProductPayload } from '@/types/api'

import HistoryPanel from './HistoryPanel.vue'
import ProductForm from './ProductForm.vue'
import ProductsTable from './ProductsTable.vue'
import SearchRunsTable from './SearchRunsTable.vue'

const todayUtc = new Date().toISOString().slice(0, 10)
const selectedDate = shallowRef(todayUtc)
const editingProductId = shallowRef<string | null>(null)

const {
  products,
  runs,
  historyRows,
  selectedProduct,
  selectedProductId,
  productsLoading,
  runsLoading,
  historyLoading,
  actionLoadingId,
  statusMessage,
  statusError,
  refreshProducts,
  refreshRuns,
  loadHistory,
  createProduct,
  updateProduct,
  deleteProduct,
  collectNow
} = useDrStoneApi()

const editingProduct = computed<TrackedProduct | null>(() => {
  if (!editingProductId.value) {
    return null
  }
  return products.value.find((product) => product.id === editingProductId.value) ?? null
})

async function loadInitialData() {
  await Promise.all([refreshProducts(true), refreshRuns(selectedDate.value, 40)])
}

function startEdit(productId: string) {
  editingProductId.value = productId
}

function cancelEdit() {
  editingProductId.value = null
}

async function handleSubmit(payload: UpsertTrackedProductPayload) {
  if (editingProductId.value) {
    await updateProduct(editingProductId.value, payload)
    editingProductId.value = null
    return
  }
  await createProduct(payload)
}

async function handleDelete(productId: string) {
  if (!window.confirm('Delete this tracked product and all linked history?')) {
    return
  }
  await deleteProduct(productId)
}

async function handleHistory(productId: string) {
  await loadHistory(productId, 120)
}

async function handleCollect(productId: string) {
  await collectNow(productId)
}

async function handleDateChange() {
  await refreshRuns(selectedDate.value, 40)
}

onMounted(async () => {
  await loadInitialData()
})
</script>

<template>
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">Dr. Stone Frontend</p>
      <h1 class="hero-title">Backend Operations Console</h1>
      <p class="hero-copy">
        Vue dashboard powered by documented Worker endpoints for tracked products, scrape runs, and historical prices.
      </p>
    </section>

    <section class="status-bar" :class="{ 'status-error': statusError }">
      {{ statusMessage }}
    </section>

    <section class="layout-grid">
      <article class="panel">
        <ProductForm :busy="productsLoading" :product="editingProduct" @cancel="cancelEdit" @submit="handleSubmit" />
        <ProductsTable
          :busy-id="actionLoadingId"
          :products="products"
          :selected-product-id="selectedProductId"
          @collect="handleCollect"
          @edit="startEdit"
          @history="handleHistory"
          @remove="handleDelete"
        />
      </article>

      <article class="panel panel-right">
        <div class="filters">
          <label class="field">
            <span class="field-label">Runs Date (UTC)</span>
            <input v-model="selectedDate" type="date" @change="handleDateChange" />
          </label>
        </div>
        <SearchRunsTable :loading="runsLoading" :runs="runs" />
        <HistoryPanel :loading="historyLoading" :product="selectedProduct" :rows="historyRows" />
      </article>
    </section>
  </main>
</template>
