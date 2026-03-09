<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'

import { useDashboardOverview } from '@/composables/useDashboardOverview'
import { formatDate } from '@/lib/formatters'
import { useDrStoneApi } from '@/composables/useDrStoneApi'
import type { TrackedProduct, UpsertTrackedProductPayload } from '@/types/api'

import DashboardOverview from './DashboardOverview.vue'
import DashboardSidebar from './DashboardSidebar.vue'
import HistoryWorkspace from './HistoryWorkspace.vue'
import ProductsWorkspace from './ProductsWorkspace.vue'
import RunsWorkspace from './RunsWorkspace.vue'
import type { DashboardOverviewRange, DashboardTab } from './dashboard.types'

const todayUtc = new Date().toISOString().slice(0, 10)

const selectedDate = shallowRef(todayUtc)
const activeTab = shallowRef<DashboardTab>('dashboard')
const editingProductId = shallowRef<string | null>(null)
const productFormInstanceKey = shallowRef(0)
const sidebarOpen = shallowRef(false)
const overviewProductId = shallowRef<string | null>(null)
const overviewRange = shallowRef<DashboardOverviewRange>('30d')

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
const {
  seriesCollection: overviewSeriesCollection,
  loading: overviewLoading,
  errorMessage: overviewErrorMessage,
  loadSeries: loadOverviewSeries
} = useDashboardOverview()

const editingProduct = computed<TrackedProduct | null>(() => {
  if (!editingProductId.value) {
    return null
  }

  return products.value.find((product) => product.id === editingProductId.value) ?? null
})

const activeProducts = computed(() => products.value.filter((product) => Boolean(product.active)).length)

const runSuccessRate = computed(() => {
  if (!runs.value.length) {
    return 0
  }

  return runs.value.filter((run) => run.status === 'succeeded').length / runs.value.length
})

const selectedOverviewSeries = computed(() => {
  if (!overviewSeriesCollection.value.length) {
    return null
  }

  return (
    overviewSeriesCollection.value.find((series) => series.productId === overviewProductId.value) ??
    overviewSeriesCollection.value[0]
  )
})

const currentTabMeta = computed(() => {
  switch (activeTab.value) {
    case 'products':
      return {
        eyebrow: 'Workspace',
        title: 'Tracked products',
        copy: 'Maintain the catalog you scrape, update terms, and trigger manual collections.'
      }
    case 'history':
      return {
        eyebrow: 'Workspace',
        title: 'Price history',
        copy: 'Inspect captured BRL prices over time and audit the source links behind each snapshot.'
      }
    case 'runs':
      return {
        eyebrow: 'Workspace',
        title: 'Collection runs',
        copy: 'Review run throughput, status, and matches with a dedicated operational timeline.'
      }
    default:
      return {
        eyebrow: 'Overview',
        title: 'Market watch dashboard',
        copy: 'A responsive control room inspired by the reference layout, adapted to product monitoring workflows.'
      }
  }
})

async function loadInitialData() {
  await Promise.all([refreshProducts(true), refreshRuns(selectedDate.value, 40)])
}

function setActiveTab(tab: DashboardTab) {
  activeTab.value = tab
  sidebarOpen.value = false
}

function openProductsTab() {
  editingProductId.value = null
  productFormInstanceKey.value += 1
  setActiveTab('products')
}

function startEdit(productId: string) {
  editingProductId.value = productId
  setActiveTab('products')
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
  productFormInstanceKey.value += 1
}

async function handleDelete(productId: string) {
  if (!window.confirm('Delete this tracked product and all linked history?')) {
    return
  }

  await deleteProduct(productId)
}

async function handleHistory(productId: string) {
  await loadHistory(productId, 120)
  setActiveTab('history')
}

async function handleCollect(productId: string) {
  await collectNow(productId)
}

async function handleDateRefresh() {
  await refreshRuns(selectedDate.value, 40)
}

watch(
  [products, overviewRange],
  ([productList]) => {
    void loadOverviewSeries(productList, overviewRange.value)
  },
  { immediate: true }
)

watch(
  products,
  (productList) => {
    const firstProductId = productList[0]?.id ?? null

    if (!productList.length) {
      overviewProductId.value = null
      return
    }

    if (!overviewProductId.value || !productList.some((product) => product.id === overviewProductId.value)) {
      overviewProductId.value = firstProductId
    }

    if (!selectedProductId.value || !productList.some((product) => product.id === selectedProductId.value)) {
      void loadHistory(firstProductId!, 120)
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await loadInitialData()
})
</script>

<template>
  <main class="app-shell">
    <div v-if="sidebarOpen" class="app-overlay" @click="sidebarOpen = false"></div>

    <DashboardSidebar
      :active-tab="activeTab"
      :mobile-open="sidebarOpen"
      :product-count="products.length"
      :run-count="runs.length"
      :status-error="statusError"
      :status-message="statusMessage"
      @close="sidebarOpen = false"
      @select-tab="setActiveTab"
    />

    <section class="app-main">
      <header class="topbar">
        <div class="topbar__intro">
          <button class="topbar__menu" type="button" @click="sidebarOpen = true">Menu</button>
          <div>
            <p class="section-kicker">{{ currentTabMeta.eyebrow }}</p>
            <h2 class="topbar__title">{{ currentTabMeta.title }}</h2>
            <p class="topbar__copy">{{ currentTabMeta.copy }}</p>
          </div>
        </div>

        <div class="topbar__actions">
          <div class="topbar__badge">Updated {{ formatDate(new Date().toISOString()) }}</div>
          <button class="btn btn-solid btn-pill" type="button" @click="openProductsTab">New product</button>
        </div>
      </header>

      <section class="status-banner" :class="{ 'is-error': statusError }">
        <span class="status-banner__dot"></span>
        <span>{{ statusMessage }}</span>
      </section>

      <section class="view-shell">
        <DashboardOverview
          v-if="activeTab === 'dashboard'"
          :active-products="activeProducts"
          :error-message="overviewErrorMessage"
          :loading="overviewLoading"
          :products="products"
          :runs-today="runs.length"
          :selected-product-id="selectedOverviewSeries?.productId ?? null"
          :selected-range="overviewRange"
          :selected-series="selectedOverviewSeries"
          :series-collection="overviewSeriesCollection"
          :success-rate="runSuccessRate"
          @select-product="overviewProductId = $event"
          @select-range="overviewRange = $event"
        />

        <ProductsWorkspace
          v-else-if="activeTab === 'products'"
          :action-loading-id="actionLoadingId"
          :editing-product="editingProduct"
          :form-instance-key="productFormInstanceKey"
          :products="products"
          :products-loading="productsLoading"
          :selected-product-id="selectedProductId"
          @cancel-edit="cancelEdit"
          @collect="handleCollect"
          @edit="startEdit"
          @history="handleHistory"
          @remove="handleDelete"
          @submit="handleSubmit"
        />

        <HistoryWorkspace
          v-else-if="activeTab === 'history'"
          :loading="historyLoading"
          :products="products"
          :rows="historyRows"
          :selected-product="selectedProduct"
          :selected-product-id="selectedProductId"
          @select-product="handleHistory"
        />

        <RunsWorkspace v-else v-model="selectedDate" :loading="runsLoading" :runs="runs" @refresh="handleDateRefresh" />
      </section>
    </section>
  </main>
</template>
