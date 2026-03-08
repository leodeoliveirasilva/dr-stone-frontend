<script setup lang="ts">
import { reactive, watch } from 'vue'

import type { TrackedProduct, UpsertTrackedProductPayload } from '@/types/api'

const MAX_SEARCH_TERMS = 5

const props = defineProps<{
  product: TrackedProduct | null
  busy: boolean
}>()

const emit = defineEmits<{
  submit: [payload: UpsertTrackedProductPayload]
  cancel: []
}>()

const form = reactive({
  title: '',
  searchTerms: [''],
  active: true
})

watch(
  () => props.product,
  (product) => {
    if (!product) {
      resetForm()
      return
    }
    form.title = product.product_title
    form.searchTerms = product.search_terms.length ? [...product.search_terms] : ['']
    form.active = Boolean(product.active)
  },
  { immediate: true }
)

function resetForm() {
  form.title = ''
  form.searchTerms = ['']
  form.active = true
}

function addSearchTerm() {
  if (form.searchTerms.length >= MAX_SEARCH_TERMS) {
    return
  }
  form.searchTerms.push('')
}

function removeSearchTerm(index: number) {
  if (form.searchTerms.length === 1) {
    form.searchTerms[0] = ''
    return
  }
  form.searchTerms.splice(index, 1)
}

function submit() {
  const searchTerms = form.searchTerms.map((term) => term.trim()).filter(Boolean)

  emit('submit', {
    title: form.title.trim(),
    search_terms: searchTerms,
    active: Boolean(form.active)
  })
}
</script>

<template>
  <form class="product-form" @submit.prevent="submit">
    <h2 class="panel-title">Tracked Product</h2>
    <p class="panel-copy">
      Create or edit up to 5 search terms. The backend runs every tracked product against all registered sources.
    </p>

    <label class="field">
      <span class="field-label">Title</span>
      <input v-model="form.title" required autocomplete="off" placeholder="RX 9070 XT Sapphire" />
    </label>

    <div class="field search-terms-field">
      <div class="field-header">
        <span class="field-label">Search Terms</span>
        <button
          class="btn btn-mini btn-ghost"
          :disabled="busy || form.searchTerms.length >= MAX_SEARCH_TERMS"
          type="button"
          @click="addSearchTerm"
        >
          Add Term
        </button>
      </div>

      <div class="search-terms-list">
        <div v-for="(term, index) in form.searchTerms" :key="`search-term-${index}`" class="search-term-row">
          <input
            v-model="form.searchTerms[index]"
            required
            autocomplete="off"
            :placeholder="index === 0 ? 'RX 9070 XT' : 'Sapphire'"
          />
          <button
            class="btn btn-mini btn-ghost"
            :disabled="busy"
            type="button"
            @click="removeSearchTerm(index)"
          >
            Remove
          </button>
        </div>
      </div>

      <p class="field-hint">All terms must match the scraped title. Maximum: 5.</p>
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
