<script setup lang="ts">
import { formatDateTime } from '@/lib/formatters'
import type { SearchRun } from '@/types/api'

defineProps<{
  runs: SearchRun[]
  loading: boolean
}>()
</script>

<template>
  <div class="panel-block panel-block--embedded">
    <div class="panel-header-row">
      <h2 class="panel-title">Search Runs</h2>
      <span class="panel-chip">{{ runs.length }}</span>
    </div>
    <p class="panel-copy">Latest runs filtered by selected UTC date.</p>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Started</th>
            <th>Product</th>
            <th>Source</th>
            <th>Status</th>
            <th>Matches</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="empty-cell">Loading runs...</td>
          </tr>
          <tr v-else-if="!runs.length">
            <td colspan="5" class="empty-cell">No runs for this date.</td>
          </tr>
          <tr v-for="run in runs" :key="run.id">
            <td data-label="Started">{{ formatDateTime(run.started_at) }}</td>
            <td data-label="Product">{{ run.tracked_product_title || run.search_term }}</td>
            <td data-label="Source">{{ run.source_name }}</td>
            <td data-label="Status">
              <span
                :class="
                  run.status === 'succeeded' ? 'badge-active' : run.status === 'failed' ? 'badge-paused' : 'badge-running'
                "
              >
                {{ run.status }}
              </span>
            </td>
            <td data-label="Matches">{{ run.matched_results ?? 0 }} / {{ run.total_results ?? 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
