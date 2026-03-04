<script setup lang="ts">
import { reactive, watch } from 'vue'

import type { TrackedProduct, UpsertTrackedProductPayload } from '@/types/api'

const props = defineProps<{
  product: TrackedProduct | null
  busy: boolean
}>()

const emit = defineEmits<{
  submit: [payload: UpsertTrackedProductPayload]
  cancel: []
}>()

const form = reactive<UpsertTrackedProductPayload>({
  title: '',
  search_term: '',
  source: 'kabum',
  scrapes_per_day: 4,
  active: true
})

watch(
  () => props.product,
  (product) => {
    if (!product) {
      form.title = ''
      form.search_term = ''
      form.source = 'kabum'
      form.scrapes_per_day = 4
      form.active = true
      return
    }
    form.title = product.product_title
    form.search_term = product.search_term
    form.source = product.source_name
    form.scrapes_per_day = Number(product.scrapes_per_day)
    form.active = Boolean(product.active)
  },
  { immediate: true }
)

function submit() {
  emit('submit', {
    title: form.title.trim(),
    search_term: form.search_term.trim(),
    source: form.source.trim() || 'kabum',
    scrapes_per_day: Number(form.scrapes_per_day),
    active: Boolean(form.active)
  })
}
</script>

<template>
  <form class="product-form" @submit.prevent="submit">
    <h2 class="panel-title">Tracked Product</h2>
    <p class="panel-copy">Create or edit search terms that feed the backend collector.</p>

    <label class="field">
      <span class="field-label">Title</span>
      <input v-model="form.title" required autocomplete="off" placeholder="RX 9070 XT" />
    </label>

    <label class="field">
      <span class="field-label">Search Term</span>
      <input v-model="form.search_term" required autocomplete="off" placeholder="RX 9070 XT" />
    </label>

    <div class="field-row">
      <label class="field">
        <span class="field-label">Source</span>
        <input v-model="form.source" required autocomplete="off" placeholder="kabum" />
      </label>

      <label class="field">
        <span class="field-label">Scrapes / Day</span>
        <input v-model.number="form.scrapes_per_day" min="1" max="1440" type="number" required />
      </label>
    </div>

    <label class="field-checkbox">
      <input v-model="form.active" type="checkbox" />
      <span>Active</span>
    </label>

    <div class="action-row">
      <button class="btn btn-solid" :disabled="busy" type="submit">
        {{ product ? 'Save Changes' : 'Create Product' }}
      </button>
      <button class="btn btn-ghost" :disabled="busy || !product" type="button" @click="emit('cancel')">
        Cancel Edit
      </button>
    </div>
  </form>
</template>
