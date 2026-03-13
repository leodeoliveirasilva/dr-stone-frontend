import { computed, onMounted, onUnmounted, shallowRef } from 'vue'

import { dashboardTabPaths, getDashboardTabFromPath, normalizeDashboardPath } from '@/components/dashboard/dashboard.routes'
import type { DashboardTab } from '@/components/dashboard/dashboard.types'

function getCurrentPath() {
  if (typeof window === 'undefined') {
    return dashboardTabPaths.dashboard
  }

  return normalizeDashboardPath(window.location.pathname)
}

export function useDashboardNavigation() {
  const currentPath = shallowRef(getCurrentPath())

  function syncPathFromLocation() {
    const matchedTab = getDashboardTabFromPath(getCurrentPath())

    if (!matchedTab) {
      currentPath.value = dashboardTabPaths.dashboard

      if (typeof window !== 'undefined') {
        window.history.replaceState(window.history.state, '', dashboardTabPaths.dashboard)
      }

      return
    }

    currentPath.value = dashboardTabPaths[matchedTab]
  }

  function navigateToTab(tab: DashboardTab) {
    if (typeof window === 'undefined') {
      currentPath.value = dashboardTabPaths[tab]
      return
    }

    const nextPath = dashboardTabPaths[tab]

    if (currentPath.value === nextPath) {
      return
    }

    currentPath.value = nextPath
    window.history.pushState(window.history.state, '', nextPath)
  }

  const activeTab = computed<DashboardTab>(() => getDashboardTabFromPath(currentPath.value) ?? 'dashboard')

  onMounted(() => {
    syncPathFromLocation()
    window.addEventListener('popstate', syncPathFromLocation)
  })

  onUnmounted(() => {
    window.removeEventListener('popstate', syncPathFromLocation)
  })

  return {
    activeTab,
    navigateToTab
  }
}
