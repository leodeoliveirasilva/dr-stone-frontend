# Backend API Instructions: Multi-Source Price Support

You are updating the API to support multi-source price visualization and filtering in the frontend.

Current frontend consumers:
- Overview chart loads minimum price history from `src/composables/useDashboardOverview.ts`
- Price history table loads rows from `src/composables/useDrStoneApi.ts`
- Current API contract is documented in `docs/API_SPEC.md`

The current contract is too source-agnostic. The new UI needs:
- a source filter on the main dashboard
- `all sources` support on the dashboard, showing one line per source
- a source filter on price history
- a backend shape that is easy to extend when new sources are added

## What to change

### 1. Introduce a canonical source model in the API

- Define one stable machine identifier per source, preferably reusing `source_name` if it is already stable (`kabum`, `pichau`, etc.).
- Also expose a human label for UI display, for example `source_label`.
- Add `GET /sources` returning all registered/enabled sources.
- `all` is not a real source in storage; it is only a synthetic frontend filter option.

Suggested response:

```json
{
  "sources": [
    {
      "source_name": "kabum",
      "source_label": "KaBuM!",
      "active": true
    }
  ]
}
```

### 2. Extend product history to support source filtering

- Update `GET /tracked-products/{tracked_product_id}/history`
- Add query param `source`
- Accepted values: `all` or a valid `source_name`
- Default: `all`
- Apply source filtering before pagination
- Keep existing `limit`, `offset`, `start_at`, `end_at`

Each history row must now include source metadata:

```json
{
  "captured_at": "2026-03-04T13:00:00+00:00",
  "product_title": "Placa de Video RX 9070 XT",
  "canonical_url": "https://www.kabum.com.br/produto/123/rx-9070-xt",
  "price": "5299.99",
  "currency": "BRL",
  "seller_name": "KaBuM!",
  "search_run_id": "5de13d9d...",
  "source_name": "kabum",
  "source_label": "KaBuM!"
}
```

Also add response-level metadata:

```json
{
  "product_id": "...",
  "product_title": "...",
  "source_filter": "all",
  "limit": 10,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "start_at": "2026-03-01",
  "end_at": "2026-03-31",
  "items": []
}
```

### 3. Refactor `/price-history/minimums` to return per-source series

- This is the key change for the dashboard chart.
- The UI needs one line per source when `source=all`, so aggregation must be per source per bucket, not global across all sources.
- Standardize the query param as `granularity`
- Keep `period` as a temporary alias only if needed for compatibility
- Add query param `source`, same rules as history

Required behavior:

- `source=kabum` => return one source series
- `source=all` => return one series per source
- Bucket logic stays the same, but minimum is calculated within each source

Suggested response:

```json
{
  "product_id": "0d95d62b8f72457d9cd8d5d2c0f7b62f",
  "product_title": "RX 9070 XT Sapphire",
  "granularity": "week",
  "start_at": "2026-03-01T00:00:00+00:00",
  "end_at": "2026-03-31T23:59:59.999999+00:00",
  "source_filter": "all",
  "series": [
    {
      "source_name": "kabum",
      "source_label": "KaBuM!",
      "items": [
        {
          "period_start": "2026-03-02T00:00:00+00:00",
          "captured_at": "2026-03-04T12:00:00+00:00",
          "product_title": "Placa de Video Sapphire Pulse Radeon RX 9070 XT 16GB",
          "canonical_url": "https://www.kabum.com.br/produto/1/rx-9070-xt",
          "price": "5499.99",
          "currency": "BRL",
          "seller_name": "KaBuM!",
          "search_run_id": "23df7f417d9147ed86c57018de93f6c9",
          "source_name": "kabum",
          "source_label": "KaBuM!"
        }
      ]
    }
  ]
}
```

### 4. Preserve backward compatibility where cheap

- Do not change tracked-product CRUD; products remain source-agnostic.
- Search runs already expose `source_name`; only align naming if needed.
- If the old frontend still expects top-level `items` on `/price-history/minimums`, either:
  - keep `items` temporarily as a legacy field, or
  - ship backend and frontend together and remove the legacy shape in one coordinated change

### 5. Refactor backend internals for future source additions

- Centralize source registration and validation in one place
- Centralize source filter parsing (`all` vs concrete source)
- Centralize serialization of `source_name` and `source_label`
- Reuse shared query/aggregation helpers for:
  - raw history rows
  - bucketed minimum series
- Avoid per-endpoint hardcoded source lists

### 6. Validation rules

- Unknown `source` => `400`
- `source=all` is valid everywhere source filtering is supported
- Date range semantics remain UTC, same as today
- History pagination must remain deterministic after source filtering

### 7. Update docs and tests

- Update `docs/API_SPEC.md`
- Fix the existing `period` vs `granularity` mismatch in the spec/implementation
- Add tests for:
  - `GET /sources`
  - product history with `source=all`
  - product history with a specific source
  - minimums with `source=all` returning multiple series
  - minimums with a specific source returning one series
  - invalid source returning `400`
  - empty result for a valid source with no data in range

## Important semantic rule

For the dashboard, `all sources` must not mean "global cheapest point across all sources merged into one line".

It must mean "return separate bucketed series for each source so the frontend can draw one colored line per source".
