# Frontend Implementation Plan: Multi-Source Price Support

This plan assumes the backend changes described in `docs/BACKEND_MULTI_SOURCE_API_HANDOFF.md` will be available.

Goal:
- add a source filter to the dashboard overview
- support `all sources` on the dashboard with one chart line per source
- add a source filter to price history
- refactor frontend data flow so adding future sources is mostly an API/data concern instead of a chart rewrite

## 1. API contract updates in the frontend

Update `src/types/api.ts` to model the new backend responses.

Add new shared types:
- `SourceOption`
- `SourceFilterValue` as `string`, with frontend using `'all'` as the synthetic option
- `SourceMetadata` with `source_name` and `source_label`

Add new API response types:
- `SourcesResponse`
- extend `ProductHistoryEntry` with `source_name` and `source_label`
- extend `ProductHistoryResponse` with `source_filter`
- replace the current single-series minimums shape with:
  - `PriceHistoryMinimumSeries`
  - `PriceHistoryMinimumEntry` including source metadata
  - `PriceHistoryMinimumsResponse` including `source_filter` and `series`

Compatibility note:
- if backend ships a temporary legacy shape for `/price-history/minimums`, normalize it once in `useDrStoneApi.ts`
- do not spread legacy handling across components

## 2. Centralize source-aware API access

Update `src/composables/useDrStoneApi.ts`.

Add source-aware fetch helpers:
- `fetchSources()`
- `fetchPriceHistoryMinimums({ productId, granularity, startAt, endAt, source })`

Extend history loading:
- `loadHistory(trackedProductId, { limit, startAt, endAt, source })`
- `loadMoreHistory(limit, { source? })` or persist active source filter internally and reuse it automatically

Persist history filter state in the composable:
- `historySource`
- keep `historyStartAt`, `historyEndAt`, `historyNextOffset`

Normalization rules:
- normalize `source_name` and `source_label` for all history and minimum rows
- normalize `/sources` into a frontend-ready options list, with synthetic `'all'` inserted in the UI layer

Reasoning:
- source parsing and legacy compatibility belong in the API composable, not in view components

## 3. Refactor dashboard overview data model to support multiple source series

Update `src/components/dashboard/dashboard.types.ts`.

Replace the current single-line chart assumption with explicit source series.

Add types like:
- `DashboardOverviewSourcePoint`
- `DashboardOverviewSourceSeries`
- `DashboardOverviewSourceFilterValue`

Refactor `DashboardOverviewSeries` so one tracked product contains many source series instead of one flat `points` array.

Suggested direction:
- `DashboardOverviewSeries` remains the per-product container
- add `sources: DashboardOverviewSourceSeries[]`
- each source series contains:
  - `sourceName`
  - `sourceLabel`
  - `colorToken`
  - `points`
  - per-source current/previous/low/high values

Keep product-level summary fields only if they are still well-defined.
Preferred approach:
- when a concrete source is selected, summary cards use that source series
- when `all` is selected, summary cards use an aggregate display rule that is explicit in code

Recommended aggregate rule for `all`:
- chart shows every source series
- headline metrics use the cheapest latest visible source for the selected product
- label this clearly in the UI as based on visible sources

## 4. Refactor `useDashboardOverview.ts` around source collections

Current issue:
- the composable assumes `/price-history/minimums` returns one flat `items` list per product

Refactor so it:
- accepts `source` as an input
- consumes `response.series`
- creates one `DashboardOverviewSourceSeries` per backend series
- assigns stable colors per source

Implementation steps:
- keep date range helpers as-is
- update `loadSeries(products, range, granularity, source)`
- build product containers with nested source series
- if source filter is concrete, keep only that source series in the result
- if source filter is `all`, keep every returned source series

Color strategy:
- define a small source color map in one place
- key colors by `source_name`
- add a fallback palette for unknown future sources

This refactor should keep future source additions local to:
- backend source registration
- frontend source option loading
- source color mapping

## 5. Update dashboard shell state and orchestration

Update `src/components/dashboard/DashboardShell.vue`.

Add new top-level state:
- `overviewSource`
- `historySource`
- `availableSources`
- `sourcesLoading` if needed

Load source options during initial load:
- fetch products
- fetch runs
- fetch sources

Update orchestration:
- overview watcher should reload when `overviewSource` changes
- history reload should include `historySource`
- when product changes in history, keep the selected source filter

Recommended component map:
- `DashboardShell.vue`: owns selected source filters and source options
- `DashboardOverview.vue`: presentational controls for overview source filter
- `HistoryWorkspace.vue`: presentational controls for history source filter
- `DashboardTrendChart.vue`: purely renders provided source series

## 6. Add source filter UI to the overview

Update `src/components/dashboard/DashboardOverview.vue`.

New props:
- `sourceOptions`
- `selectedSource`

New emit:
- `selectSource`

UI change:
- add a new filter control beside product and granularity
- include `All sources` as the first option

Behavior:
- selecting a single source shows one line
- selecting `All sources` shows multiple lines, one per source

Summary updates:
- if one visible source exists, use that source directly
- if multiple visible sources exist, make the displayed summary rule explicit

Also update copy:
- the chart now shows per-source minimums, not only one merged minimum line

## 7. Refactor the chart component for multi-line rendering

Update `src/components/dashboard/DashboardTrendChart.vue`.

Current issue:
- it only accepts one `points` array and one area/line path

Refactor props:
- accept `series: DashboardOverviewSourceSeries[]`

Rendering behavior:
- one polyline/path per source
- one point set per source
- one focus point per visible source, or simplify by not rendering a focus ring in multi-source mode
- optional legend showing source label and matching color

Recommended rendering rules:
- for one source:
  - keep area fill if desired
  - keep current focused point treatment
- for multiple sources:
  - disable shared area fill to avoid visual clutter
  - render line + points + legend

Axis/domain behavior:
- compute min/max across all visible source points
- preserve current label generation strategy

## 8. Add source filter UI to history

Update `src/components/dashboard/HistoryWorkspace.vue`.

New props:
- `sourceOptions`
- `selectedSource`

New emit:
- `selectSource`

UI change:
- add a source select in the filter bar next to product/date filters
- keep `All sources` as the first option

Behavior:
- changing source reloads history for the selected product with the same date window
- clearing date range should not reset the selected source

## 9. Surface source metadata in the history table

Update `src/components/dashboard/HistoryPanel.vue`.

Add a `Source` column.

Recommended table columns:
- Captured
- Source
- Product
- Price
- Seller
- Link

Mobile behavior:
- make sure the `data-label` values include the new source field

If useful, visually group by source later, but initial implementation should stay simple and sortable by captured timestamp as today.

## 10. Keep source option building centralized

Create a small helper or composable, only if needed, for source options.

Possible location:
- `src/composables/useDrStoneApi.ts` if the list is purely API-driven
- or a small helper under `src/components/dashboard/` if it is only view formatting

Rules:
- prepend synthetic `All sources`
- use backend `source_label` for display
- use backend `source_name` for request values and color keys

Avoid scattering `'all'` string literals across many components.

## 11. Suggested implementation order

1. Update API types in `src/types/api.ts`
2. Update `useDrStoneApi.ts` normalization and source-aware requests
3. Refactor `dashboard.types.ts` for nested source series
4. Refactor `useDashboardOverview.ts`
5. Update `DashboardShell.vue` state orchestration
6. Update `DashboardOverview.vue` source filter UI
7. Refactor `DashboardTrendChart.vue` for multi-line rendering
8. Update `HistoryWorkspace.vue` source filter UI
9. Update `HistoryPanel.vue` source column
10. Polish empty states, labels, and loading messages

## 12. Verification checklist

Functional checks:
- overview source filter loads one source correctly
- overview `All sources` shows one line per returned source
- line colors stay stable across reloads
- overview product/range/granularity/source changes do not produce stale chart data
- history source filter reloads correctly
- history pagination respects the active source filter
- history date changes preserve the active source filter
- switching products preserves or intentionally resets source filters according to the chosen UX

Edge cases:
- no sources returned
- product has data for only one source while `All sources` is selected
- product has no data in range
- backend returns a source not present in the initial `/sources` list

## 13. Non-goals for the first pass

- do not add cross-source comparison analytics beyond the chart and simple summaries
- do not add grouped history sections per source
- do not add source-specific product tracking configuration; tracked products remain source-agnostic

## 14. Recommended small refactor boundaries

Keep these boundaries explicit during implementation:
- API normalization in `useDrStoneApi.ts`
- overview transformation in `useDashboardOverview.ts`
- shell state in `DashboardShell.vue`
- rendering in presentational components

That keeps future additions of new sources mostly isolated to:
- backend source registration
- frontend source list loading
- source color mapping
