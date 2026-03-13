<script setup lang="ts">
import { computed } from 'vue'

import type { TrackedProduct } from '@/types/api'

const props = withDefaults(
  defineProps<{
    products: TrackedProduct[]
    selectedProductId: string | null
    label?: string
    ariaLabel?: string
  }>(),
  {
    label: 'Product',
    ariaLabel: 'Select tracked product'
  }
)

const emit = defineEmits<{
  selectProduct: [productId: string]
}>()

const selectedProductValue = computed(() => props.selectedProductId ?? props.products[0]?.id ?? '')

function handleProductChange(event: Event) {
  const nextProductId = (event.target as HTMLSelectElement).value
  if (nextProductId) {
    emit('selectProduct', nextProductId)
  }
}
</script>

<template>
  <label class="chart-filter">
    <span class="chart-filter__label">{{ label }}</span>
    <select
      class="chart-filter__select"
      :value="selectedProductValue"
      :aria-label="ariaLabel"
      @change="handleProductChange"
    >
      <option v-for="product in products" :key="product.id" :value="product.id">
        {{ product.product_title }}
      </option>
    </select>
  </label>
</template>
