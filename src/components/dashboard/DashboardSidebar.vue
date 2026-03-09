<script setup lang="ts">
import type { DashboardTab } from './dashboard.types'

const props = defineProps<{
  activeTab: DashboardTab
  mobileOpen: boolean
  productCount: number
  runCount: number
  statusMessage: string
  statusError: boolean
}>()

const emit = defineEmits<{
  selectTab: [tab: DashboardTab]
  close: []
}>()

const navItems: Array<{ id: DashboardTab; label: string; badge?: () => string | null }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'products', label: 'Products', badge: () => String(props.productCount) },
  { id: 'history', label: 'Price History' },
  { id: 'runs', label: 'Runs', badge: () => String(props.runCount) }
]

function selectTab(tab: DashboardTab) {
  emit('selectTab', tab)
}
</script>

<template>
  <aside class="app-sidebar" :class="{ 'is-open': mobileOpen }" aria-label="Primary">
    <div class="sidebar-brand">
      <button class="sidebar-mobile-close" type="button" @click="emit('close')">Close</button>
      <img class="brand-mark" src="/favicon.png" alt="" aria-hidden="true" />
      <div>
        <p class="brand-kicker">Dr. Stone</p>
        <h1 class="brand-title">Control Center</h1>
      </div>
    </div>

    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="sidebar-link"
        :class="{ 'is-active': activeTab === item.id }"
        type="button"
        @click="selectTab(item.id)"
      >
        <span class="sidebar-link__icon" :data-tab="item.id" aria-hidden="true"></span>
        <span class="sidebar-link__label">{{ item.label }}</span>
        <span v-if="item.badge?.()" class="sidebar-link__badge">{{ item.badge?.() }}</span>
      </button>
    </nav>

    <div class="sidebar-status" :class="{ 'is-error': statusError }">
      <p class="sidebar-status__label">System status</p>
      <p class="sidebar-status__message">{{ statusMessage }}</p>
    </div>
  </aside>
</template>
