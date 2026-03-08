import type { TrackedProduct } from '@/types/api'

export interface MockPricePoint {
  date: string
  label: string
  value: number
}

export interface MockProductSeries {
  productId: string
  productTitle: string
  currentValue: number
  previousValue: number
  deltaPercent: number
  lowValue: number
  highValue: number
  points: MockPricePoint[]
}

function hashValue(input: string) {
  let hash = 0

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 2147483647
  }

  return hash
}

function buildPointLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function createMockProductSeries(products: TrackedProduct[], totalDays = 90): MockProductSeries[] {
  return products.map((product, productIndex) => {
    const seed = hashValue(`${product.id}:${product.product_title}`)
    const base = 2400 + (seed % 4200)
    const swing = 90 + (seed % 260)
    const drift = ((seed % 17) - 8) * 1.45

    const points = Array.from({ length: totalDays }, (_, pointIndex) => {
      const date = new Date()
      date.setDate(date.getDate() - (totalDays - pointIndex - 1))

      const waveA = Math.sin((pointIndex + productIndex * 3) / 5.2) * swing
      const waveB = Math.cos((pointIndex + seed % 13) / 9.6) * swing * 0.42
      const trend = drift * pointIndex
      const microShift = ((seed + pointIndex * 19) % 11) - 5
      const value = Math.max(90, Math.round((base + waveA + waveB + trend + microShift) * 100) / 100)

      return {
        date: date.toISOString().slice(0, 10),
        label: buildPointLabel(date),
        value
      }
    })

    const currentValue = points.at(-1)?.value ?? base
    const previousValue = points.at(-2)?.value ?? currentValue
    const deltaPercent = previousValue ? ((currentValue - previousValue) / previousValue) * 100 : 0
    const values = points.map((point) => point.value)

    return {
      productId: product.id,
      productTitle: product.product_title,
      currentValue,
      previousValue,
      deltaPercent,
      lowValue: Math.min(...values),
      highValue: Math.max(...values),
      points
    }
  })
}
