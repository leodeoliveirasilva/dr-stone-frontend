<script setup lang="ts">
import { computed, nextTick, reactive, useTemplateRef, watch } from 'vue'

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
  searchTerms: [] as string[],
  pendingSearchTerm: '',
  active: true
})

const searchTermInput = useTemplateRef<HTMLInputElement>('searchTermInput')

const canAddSearchTerm = computed(() => form.searchTerms.length < MAX_SEARCH_TERMS)

watch(
  () => props.product,
  (product) => {
    if (!product) {
      resetForm()
      return
    }
    form.title = product.product_title
    form.searchTerms = [...product.search_terms]
    form.pendingSearchTerm = ''
    form.active = Boolean(product.active)
  },
  { immediate: true }
)

function resetForm() {
  form.title = ''
  form.searchTerms = []
  form.pendingSearchTerm = ''
  form.active = true
}

function focusSearchTermInput() {
  if (!canAddSearchTerm.value) {
    return
  }

  nextTick(() => {
    searchTermInput.value?.focus()
  })
}

function clearSearchTermValidity() {
  searchTermInput.value?.setCustomValidity('')
}

function addSearchTerm(rawTerm = form.pendingSearchTerm) {
  const term = rawTerm.trim()

  if (!term || !canAddSearchTerm.value) {
    return
  }

  form.searchTerms.push(term)
  form.pendingSearchTerm = ''
  clearSearchTermValidity()
  focusSearchTermInput()
}

function removeSearchTerm(index: number) {
  form.searchTerms.splice(index, 1)
  clearSearchTermValidity()
  focusSearchTermInput()
}

function handleSearchTermKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ',') {
    return
  }

  event.preventDefault()
  addSearchTerm()
}

function submit() {
  const pendingSearchTerm = form.pendingSearchTerm.trim()

  if (pendingSearchTerm && form.searchTerms.length < MAX_SEARCH_TERMS) {
    form.searchTerms.push(pendingSearchTerm)
    form.pendingSearchTerm = ''
  }

  const searchTerms = [...form.searchTerms]

  if (!searchTerms.length) {
    searchTermInput.value?.setCustomValidity('Add at least one search term.')
    searchTermInput.value?.reportValidity()
    focusSearchTermInput()
    return
  }

  clearSearchTermValidity()

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
        <span class="field-meta">{{ form.searchTerms.length }}/{{ MAX_SEARCH_TERMS }}</span>
      </div>

      <div class="multi-input" :class="{ 'is-disabled': busy, 'is-full': !canAddSearchTerm }" @click="focusSearchTermInput">
        <div v-for="(term, index) in form.searchTerms" :key="`${term}-${index}`" class="multi-input-pill">
          <span class="multi-input-pill__label">{{ term }}</span>
          <button
            class="multi-input-pill__remove"
            :aria-label="`Remove ${term}`"
            :disabled="busy"
            type="button"
            @click="removeSearchTerm(index)"
          >
            ×
          </button>
        </div>

        <input
          v-if="canAddSearchTerm"
          ref="searchTermInput"
          v-model="form.pendingSearchTerm"
          class="multi-input-field"
          autocomplete="off"
          :disabled="busy"
          :placeholder="form.searchTerms.length ? 'Add another term' : 'Type a term and press Enter'"
          @keydown="handleSearchTermKeydown"
        />

        <button
          v-if="canAddSearchTerm"
          class="btn btn-mini btn-ghost multi-input-action"
          :disabled="busy || !form.pendingSearchTerm.trim()"
          type="button"
          @click="addSearchTerm()"
        >
          Add
        </button>
      </div>

      <p class="field-hint">All terms must match the scraped title. Press Enter or comma to add up to 5 terms.</p>
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
