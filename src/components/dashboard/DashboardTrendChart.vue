<script setup lang="ts">
import { computed } from 'vue'

import { formatCurrency } from '@/lib/formatters'
import type { MockPricePoint } from '@/lib/dashboard-mocks'

const props = defineProps<{
  points: MockPricePoint[]
}>()

const chartWidth = 760
const chartHeight = 280
const padding = { top: 22, right: 18, bottom: 36, left: 18 }

const chartMetrics = computed(() => {
  if (!props.points.length) {
    return {
      areaPath: '',
      linePath: '',
      labels: [] as string[],
      gridLines: [] as Array<{ key: string; y: number; label: string }>,
      focusPoint: null as null | { x: number; y: number; value: number; label: string }
    }
  }

  const values = props.points.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueSpan = Math.max(1, maxValue - minValue)

  const toX = (index: number) => {
    if (props.points.length === 1) {
      return chartWidth / 2
    }

    return (
      padding.left +
      (index / (props.points.length - 1)) * (chartWidth - padding.left - padding.right)
    )
  }

  const toY = (value: number) =>
    padding.top +
    ((maxValue - value) / valueSpan) * (chartHeight - padding.top - padding.bottom)

  const coordinates = props.points.map((point, index) => ({
    x: toX(index),
    y: toY(point.value),
    value: point.value,
    label: point.label
  }))

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')

  const firstPoint = coordinates[0]
  const lastPoint = coordinates.at(-1) ?? firstPoint

  const areaPath = `${linePath} L ${lastPoint.x.toFixed(2)} ${(chartHeight - padding.bottom).toFixed(2)} L ${firstPoint.x.toFixed(2)} ${(chartHeight - padding.bottom).toFixed(2)} Z`

  const gridLines = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3
    const value = maxValue - valueSpan * ratio
    const y = toY(value)

    return {
      key: `${index}-${value}`,
      y,
      label: formatCurrency(value)
    }
  })

  const labelIndexes = [0, Math.floor((props.points.length - 1) / 2), props.points.length - 1]
  const labels = labelIndexes.map((index) => props.points[index]?.label ?? '')

  return {
    areaPath,
    linePath,
    labels,
    gridLines,
    focusPoint: lastPoint
  }
})
</script>

<template>
  <div class="trend-chart">
    <svg
      class="trend-chart__svg"
      :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
      role="img"
      aria-label="Mocked price history chart"
    >
      <defs>
        <linearGradient id="trendAreaGradient" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(83, 141, 255, 0.34)" />
          <stop offset="100%" stop-color="rgba(83, 141, 255, 0.03)" />
        </linearGradient>
      </defs>

      <g v-for="line in chartMetrics.gridLines" :key="line.key">
        <line class="trend-chart__grid" :x1="padding.left" :x2="chartWidth - padding.right" :y1="line.y" :y2="line.y" />
        <text class="trend-chart__grid-label" :x="chartWidth - padding.right" :y="line.y - 6">
          {{ line.label }}
        </text>
      </g>

      <path v-if="chartMetrics.areaPath" class="trend-chart__area" :d="chartMetrics.areaPath" />
      <path v-if="chartMetrics.linePath" class="trend-chart__line" :d="chartMetrics.linePath" />

      <g v-if="chartMetrics.focusPoint" class="trend-chart__focus">
        <circle class="trend-chart__focus-ring" :cx="chartMetrics.focusPoint.x" :cy="chartMetrics.focusPoint.y" r="11" />
        <circle class="trend-chart__focus-dot" :cx="chartMetrics.focusPoint.x" :cy="chartMetrics.focusPoint.y" r="4.5" />
      </g>
    </svg>

    <div class="trend-chart__labels">
      <span v-for="label in chartMetrics.labels" :key="label">{{ label }}</span>
    </div>
  </div>
</template>
