# Dr. Stone Backend API Specification (Frontend Use)

Last updated: 2026-03-08

Base URL examples:

- local: `http://127.0.0.1:8787`
- production: `<your-worker-domain>`

## Conventions

- Content type: JSON for request and response bodies except `DELETE` returning `204` empty body
- Date format for `date` query: `YYYY-MM-DD` (UTC)
- Tracked products are source-agnostic and collected across all registered backend sources.
- Tracked products use `search_terms` with a minimum of 1 and maximum of 5 entries.
- Collection cadence is global and is not configured per product.
- Generic error shape:

```json
{
  "error": "message",
  "error_type": "RuntimeError"
}
```

`error_type` appears on unhandled server errors (`500`) and may be absent on `400/404`.

## Endpoints

### 1) Root status

- Method: `GET`
- Path: `/`
- Input: none
- Success `200`:

```json
{
  "name": "dr-stone-api",
  "status": "ok"
}
```

### 2) Health check

- Method: `GET`
- Path: `/health`
- Input: none
- Success `200`:

```json
{
  "status": "ok"
}
```

### 3) List tracked products

- Method: `GET`
- Path: `/tracked-products`
- Query:
- `all=1` optional, include inactive rows
- Success `200`:

```json
[
  {
    "id": "2ac7f8f2...",
    "product_title": "RX 9070 XT Sapphire",
    "search_terms": ["RX 9070 XT", "Sapphire"],
    "active": true,
    "created_at": "2026-03-04T12:00:00+00:00",
    "updated_at": "2026-03-04T12:00:00+00:00"
  }
]
```

### 4) Create tracked product

- Method: `POST`
- Path: `/tracked-products`
- Body:

```json
{
  "title": "RX 9070 XT Sapphire",
  "search_terms": ["RX 9070 XT", "Sapphire"],
  "active": true
}
```

- Success `201`: created tracked product row
- Errors:
- `400` missing/invalid fields
- `400` if `search_terms` has more than 5 entries
- `400` if `scrapes_per_day` is sent
- Legacy compatibility: backend still accepts a single `search_term` field when `search_terms` is omitted

### 5) Get tracked product by id

- Method: `GET`
- Path: `/tracked-products/{tracked_product_id}`
- Success `200`: tracked product row
- Errors:
- `404` unknown id

### 6) Update tracked product

- Method: `PUT` or `PATCH`
- Path: `/tracked-products/{tracked_product_id}`
- Body (partial allowed):

```json
{
  "title": "RX 9070 XT Sapphire Nitro",
  "search_terms": ["RX 9070 XT", "Sapphire", "Nitro"],
  "active": true
}
```

- Success `200`: updated tracked product row
- Errors:
- `400` invalid payload
- `404` unknown id

### 7) Delete tracked product

- Method: `DELETE`
- Path: `/tracked-products/{tracked_product_id}`
- Success `204`: empty body
- Errors:
- `404` unknown id

### 8) List product history

- Method: `GET`
- Path: `/tracked-products/{tracked_product_id}/history`
- Query:
- `limit` optional (default `100`, max `500`)
- Success `200`:

```json
[
  {
    "captured_at": "2026-03-04T13:00:00+00:00",
    "product_title": "Placa de Video RX 9070 XT",
    "canonical_url": "https://www.kabum.com.br/produto/123/rx-9070-xt",
    "price": "5299.99",
    "currency": "BRL",
    "seller_name": "KaBuM!",
    "search_run_id": "5de13d9d..."
  }
]
```

- Errors:
- `400` invalid `limit`

### 9) List search runs by date

- Method: `GET`
- Path: `/search-runs`
- Query:
- `date` optional in `YYYY-MM-DD`
- `limit` optional (default `40`, max `200`)

- Success `200`:

```json
{
  "date": "2026-03-04",
  "runs": [
    {
      "id": "5de13d9d...",
      "tracked_product_id": "2ac7f8f2...",
      "source_name": "kabum",
      "search_term": "RX 9070 XT Sapphire",
      "search_url": "https://www.kabum.com.br/busca/rx-9070-xt-sapphire",
      "status": "succeeded",
      "started_at": "2026-03-04T13:00:00+00:00",
      "finished_at": "2026-03-04T13:00:12+00:00",
      "duration_ms": 12000,
      "total_results": 53,
      "matched_results": 4,
      "page_count": 3,
      "message": "lowest_prices_saved",
      "created_at": "2026-03-04T13:00:00+00:00",
      "tracked_product_title": "RX 9070 XT Sapphire",
      "tracked_product_active": true,
      "items": [
        {
          "search_run_id": "5de13d9d...",
          "product_title": "Placa de Video Sapphire Pulse Radeon RX 9070 XT 16GB",
          "canonical_url": "https://www.kabum.com.br/produto/123/rx-9070-xt",
          "price_value": "5299.99",
          "currency": "BRL",
          "seller_name": "KaBuM!",
          "availability": "in_stock",
          "is_available": true,
          "position": 2,
          "captured_at": "2026-03-04T13:00:11+00:00"
        }
      ]
    }
  ]
}
```

- Errors:
- `400` invalid date format or invalid limit

### 10) Collect due products now

- Method: `POST`
- Path: `/collect-due`
- Input: none
- Notes:
- Compatibility endpoint.
- Currently behaves like collecting all active tracked products because cadence is global.
- Success `200`:

```json
[
  {
    "tracked_product_id": "2ac7f8f2...",
    "search_run_ids": ["5de13d9d...", "11ee9c3a..."],
    "successful_runs": 2,
    "failed_runs": 0,
    "total_results": 53,
    "matched_results": 4,
    "page_count": 3
  }
]
```

### 11) Trigger manual collect for one product

- Method: `POST`
- Path: `/tracked-products/{tracked_product_id}`
- Query:
- `action=collect` required

- Success `200`:

```json
{
  "tracked_product_id": "2ac7f8f2...",
  "search_run_ids": ["5de13d9d...", "11ee9c3a..."],
  "successful_runs": 2,
  "failed_runs": 0,
  "total_results": 53,
  "matched_results": 4,
  "page_count": 3
}
```

- Errors:
- `404` unknown or inactive product
- `500` scraper/runtime failure

## Frontend Integration Notes

- Use `all=1` for product management screens so inactive rows remain visible.
- Render tracked product terms as a list, not a single string.
- Treat `active`, `tracked_product_active`, and `is_available` as booleans.
- Always send `content-type: application/json` for `POST/PUT/PATCH`.
- Parse and display `error` from non-2xx responses.
