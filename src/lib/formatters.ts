const defaultCurrency = 'BRL'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: defaultCurrency,
  maximumFractionDigits: 2
})

const compactNumberFormatter = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1
})

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 1
})

export function formatCurrency(value: number, currency = defaultCurrency) {
  if (currency !== defaultCurrency) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(value)
  }

  return currencyFormatter.format(value)
}

export function formatCompactNumber(value: number) {
  return compactNumberFormatter.format(value)
}

export function formatPercent(value: number) {
  return percentFormatter.format(value)
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
