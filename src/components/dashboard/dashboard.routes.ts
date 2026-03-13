import type { DashboardTab } from './dashboard.types'

export const dashboardTabPaths: Record<DashboardTab, string> = {
  dashboard: '/',
  products: '/products',
  history: '/history',
  runs: '/runs'
}

const dashboardPathEntries = Object.entries(dashboardTabPaths) as Array<[DashboardTab, string]>

export function normalizeDashboardPath(path: string) {
  return path.replace(/\/+$/, '') || '/'
}

export function getDashboardTabFromPath(path: string) {
  const normalizedPath = normalizeDashboardPath(path)
  return dashboardPathEntries.find(([, routePath]) => routePath === normalizedPath)?.[0] ?? null
}
