# Frontend Product Specification

Last updated: 2026-03-08

This specification was moved from backend planning notes into `dr-stone-frontend` to keep frontend and backend concerns separate.

## Product Goal

Build a dashboard UI that allows users to:

- manage tracked products used by backend scraping
- inspect scrape runs by day
- inspect historical captured prices per tracked product

## Boundaries

- Frontend handles rendering, interaction, and API request orchestration.
- Backend handles scraping, aggregation, persistence, and scheduling.
- Frontend should not re-implement backend aggregation rules.

## Information Architecture

- View 1: Tracked products CRUD
- View 2: Search runs by UTC date
- View 3: Product price history table

## Functional Requirements

1. Product management
- create tracked product
- edit tracked product
- manage up to 5 search terms per product
- delete tracked product
- trigger manual collect action

2. Search runs
- load runs filtered by selected date
- display status, totals, and matched counts

3. Price history
- load product-specific history
- show capture timestamp, price, seller, and source link

4. API-driven status
- show operation feedback for loading, success, and failure

## Component Map

- `App.vue`: root composition surface
- `DashboardShell.vue`: feature orchestration, binds composable state to child components
- `ProductForm.vue`: create/edit form for tracked products
- `ProductsTable.vue`: tracked products list + actions
- `SearchRunsTable.vue`: run list filtered by date
- `HistoryPanel.vue`: selected product history table
- `useDrStoneApi.ts`: backend API state/actions

## Non-Functional Requirements

- Strong typing for API payloads and responses
- Responsive layout for desktop and mobile
- Deterministic request handling and error messaging
- Minimal client complexity; no hidden global mutable state

## Deliverables

- frontend dashboard implementation
- API endpoint documentation for frontend integration
- frontend deploy pipeline on Cloudflare Pages

## Current Backend Contract Notes

- Tracked products are source-agnostic.
- Collection always runs across all registered backend sources.
- Per-product `scrapes_per_day` is removed from the UI contract because collection cadence is global.
