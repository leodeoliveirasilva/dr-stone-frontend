<script setup lang="ts">
import { computed } from 'vue'

import { formatCurrency } from '@/lib/formatters'
import type { DashboardOverviewSourceSeries } from './dashboard.types'

let nextChartId = 0

const props = defineProps<{
  series: DashboardOverviewSourceSeries[]
}>()

const chartWidth = 760
const chartHeight = 280
const padding = { top: 22, right: 18, bottom: 36, left: 18 }
const chartId = `trend-chart-${nextChartId++}`

function withAlpha(color: string, alpha: number) {
  const normalized = color.trim()

  if (normalized.startsWith('#')) {
    const hex = normalized.slice(1)
    const expandedHex =
      hex.length === 3
        ? hex
            .split('')
            .map((char) => `${char}${char}`)
            .join('')
        : hex

    if (expandedHex.length === 6) {
      const red = Number.parseInt(expandedHex.slice(0, 2), 16)
      const green = Number.parseInt(expandedHex.slice(2, 4), 16)
      const blue = Number.parseInt(expandedHex.slice(4, 6), 16)

      return `rgba(${red}, ${green}, ${blue}, ${alpha})`
    }
  }

  return normalized
}

const chartMetrics = computed(() => {
  const visibleSeries = props.series.filter((series) => series.points.length)

  if (!visibleSeries.length) {
    return {
      labels: [] as string[],
      gridLines: [] as Array<{ key: string; y: number; label: string }>,
      series: [] as Array<{
        sourceName: string
        sourceLabel: string
        colorToken: string
        areaGradientId: string
        areaGradientStops: Array<{ offset: string; color: string }>
        areaPath: string
        linePath: string
        coordinates: Array<{
          key: string
          x: number
          y: number
          value: number
          label: string
          canonicalUrl: string
          sourceLabel: string
        }>
        focusPoint: null | { x: number; y: number }
      }>
    }
  }

  const allPoints = visibleSeries.flatMap((series) => series.points)
  const values = allPoints.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueSpan = Math.max(1, maxValue - minValue)
  const timestamps = allPoints.map((point) => new Date(point.date).getTime())
  const minTimestamp = Math.min(...timestamps)
  const maxTimestamp = Math.max(...timestamps)
  const timeSpan = Math.max(1, maxTimestamp - minTimestamp)

  const toX = (value: string) => {
    if (minTimestamp === maxTimestamp) {
      return chartWidth / 2
    }

    return (
      padding.left +
      ((new Date(value).getTime() - minTimestamp) / timeSpan) * (chartWidth - padding.left - padding.right)
    )
  }

  const toY = (value: number) =>
    padding.top +
    ((maxValue - value) / valueSpan) * (chartHeight - padding.top - padding.bottom)

  const chartSeries = visibleSeries.map((series) => {
    const coordinates = series.points.map((point, index) => ({
      key: `${series.sourceName}-${point.date}-${index}`,
      x: toX(point.date),
      y: toY(point.value),
      value: point.value,
      label: point.label,
      canonicalUrl: point.canonicalUrl,
      sourceLabel: point.sourceLabel
    }))

    const linePath = coordinates
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ')

    const firstPoint = coordinates[0]
    const lastPoint = coordinates.at(-1) ?? firstPoint

    return {
      sourceName: series.sourceName,
      sourceLabel: series.sourceLabel,
      colorToken: series.colorToken,
      areaGradientId: `${chartId}-${series.sourceName}-area`,
      areaGradientStops: [
        { offset: '0%', color: withAlpha(series.colorToken, visibleSeries.length === 1 ? 0.34 : 0.24) },
        { offset: '100%', color: withAlpha(series.colorToken, 0.04) }
      ],
      areaPath: `${linePath} L ${lastPoint.x.toFixed(2)} ${(chartHeight - padding.bottom).toFixed(2)} L ${firstPoint.x.toFixed(2)} ${(chartHeight - padding.bottom).toFixed(2)} Z`,
      linePath,
      coordinates,
      focusPoint: visibleSeries.length === 1 ? { x: lastPoint.x, y: lastPoint.y } : null
    }
  })

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

  const uniqueLabelEntries = [...allPoints]
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
    .filter((point, index, collection) => {
      return index === 0 || point.date !== collection[index - 1]?.date
    })
  const labelIndexes = [
    0,
    Math.floor((uniqueLabelEntries.length - 1) / 2),
    uniqueLabelEntries.length - 1
  ]
  const labels = labelIndexes.map((index) => uniqueLabelEntries[index]?.label ?? '')

  return {
    labels,
    gridLines,
    series: chartSeries
  }
})
</script>

<template>
  <div class="trend-chart">
    <div v-if="chartMetrics.series.length > 1" class="trend-chart__legend">
      <span
        v-for="source in chartMetrics.series"
        :key="source.sourceName"
        class="trend-chart__legend-item"
      >
        <span class="trend-chart__legend-swatch" :style="{ backgroundColor: source.colorToken }"></span>
        <span>{{ source.sourceLabel }}</span>
      </span>
    </div>

    <svg
      class="trend-chart__svg"
      :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
      role="img"
      aria-label="Price history minimums chart"
    >
      <defs>
        <linearGradient
          v-for="source in chartMetrics.series"
          :id="source.areaGradientId"
          :key="source.areaGradientId"
          x1="0%"
          x2="0%"
          y1="0%"
          y2="100%"
        >
          <stop
            v-for="stop in source.areaGradientStops"
            :key="stop.offset"
            :offset="stop.offset"
            :stop-color="stop.color"
          />
        </linearGradient>
      </defs>

      <g v-for="line in chartMetrics.gridLines" :key="line.key">
        <line class="trend-chart__grid" :x1="padding.left" :x2="chartWidth - padding.right" :y1="line.y" :y2="line.y" />
        <text class="trend-chart__grid-label" :x="chartWidth - padding.right" :y="line.y - 6">
          {{ line.label }}
        </text>
      </g>

      <g
        v-for="source in chartMetrics.series"
        :key="source.sourceName"
        :style="{ '--trend-color': source.colorToken }"
      >
        <path
          v-if="source.areaPath"
          class="trend-chart__area"
          :d="source.areaPath"
          :style="{ fill: `url(#${source.areaGradientId})` }"
        />
        <path
          v-if="source.linePath"
          class="trend-chart__line"
          :d="source.linePath"
        />
        <a
          v-for="point in source.coordinates"
          :key="point.key"
          class="trend-chart__point-link"
          :href="point.canonicalUrl"
          rel="noreferrer"
          target="_blank"
          :aria-label="`Open ${point.sourceLabel} product page for ${point.label} at ${formatCurrency(point.value)}`"
        >
          <title>{{ `${point.sourceLabel} • ${point.label} • ${formatCurrency(point.value)}` }}</title>
          <circle class="trend-chart__point-hitbox" :cx="point.x" :cy="point.y" r="10" />
          <circle
            class="trend-chart__point"
            :cx="point.x"
            :cy="point.y"
            r="4"
          />
        </a>

        <g v-if="source.focusPoint" class="trend-chart__focus">
          <circle class="trend-chart__focus-ring" :cx="source.focusPoint.x" :cy="source.focusPoint.y" r="11" />
          <circle
            class="trend-chart__focus-dot"
            :cx="source.focusPoint.x"
            :cy="source.focusPoint.y"
            r="4.5"
          />
        </g>
      </g>
    </svg>

    <div class="trend-chart__labels">
      <span v-for="label in chartMetrics.labels" :key="label">{{ label }}</span>
    </div>
  </div>
</template>
