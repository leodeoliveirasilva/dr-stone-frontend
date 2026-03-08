<script setup lang="ts">
import { computed } from 'vue'

import type { SearchRun } from '@/types/api'

import SearchRunsTable from './SearchRunsTable.vue'

const selectedDate = defineModel<string>({ required: true })

const props = defineProps<{
  runs: SearchRun[]
  loading: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

const stats = computed(() => {
  const succeeded = props.runs.filter((run) => run.status === 'succeeded').length
  const failed = props.runs.filter((run) => run.status === 'failed').length
  const running = props.runs.filter((run) => run.status === 'running').length

  return { succeeded, failed, running }
})
</script>

<template>
  <section class="view-stack">
    <header class="view-header">
      <div>
        <p class="section-kicker">Runs</p>
        <h2 class="view-title">Monitor collection runs</h2>
        <p class="view-copy">Filter by UTC date and inspect source execution, match volume, and completion status.</p>
      </div>
    </header>

    <section class="overview-grid overview-grid--runs">
      <article class="metric-card" data-tone="neutral">
        <p class="metric-card__label">Selected date</p>
        <div class="run-filter-row">
          <input v-model="selectedDate" class="run-filter-input" type="date" @change="emit('refresh')" />
        </div>
      </article>
      <article class="metric-card" data-tone="success">
        <p class="metric-card__label">Succeeded</p>
        <p class="metric-card__value">{{ stats.succeeded }}</p>
      </article>
      <article class="metric-card" data-tone="accent">
        <p class="metric-card__label">Running</p>
        <p class="metric-card__value">{{ stats.running }}</p>
      </article>
      <article class="metric-card" data-tone="neutral">
        <p class="metric-card__label">Failed</p>
        <p class="metric-card__value">{{ stats.failed }}</p>
      </article>
    </section>

    <article class="surface">
      <SearchRunsTable :loading="loading" :runs="runs" />
    </article>
  </section>
</template>
