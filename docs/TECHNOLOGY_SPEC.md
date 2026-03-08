# Frontend Technology Specification

Last updated: 2026-03-08

## Objective

Define the official technology stack and implementation conventions for `dr-stone-frontend`.

## Runtime and Platform

- Deployment target: Cloudflare Pages
- Runtime model: static frontend (SPA) consuming backend Worker API
- Backend API base URL provided via `API_BASE_URL`
- Current live API endpoint: `https://dr-stone-api-production.up.railway.app`
- Node.js version: `24.14.0`

## Core Stack

- Framework: Vue 3
- Language: TypeScript
- Build tool: Vite
- Package manager: npm
- Component model: Composition API with `<script setup lang="ts">`

## UI and Styling

- Styling approach: handcrafted CSS with design tokens in `src/styles.css`
- Design direction: editorial/console aesthetic with high readability and strong contrast
- Responsive behavior: mobile-first breakpoints with single-column fallback below `1024px`

## State and Data Layer

- State location: feature composables (`src/composables/`)
- API integration: typed fetch client (`src/lib/api-client.ts`)
- Data contracts: centralized interfaces in `src/types/api.ts`
- Backend contract source of truth: `docs/API_SPEC.md`

## Quality Gates

- Type safety: `npm run typecheck` (vue-tsc)
- Build verification: `npm run build`
- CI deploy gate: typecheck + build must pass before deploy

## Deployment and CI/CD

- Pipeline location: `.github/workflows/deploy.yml`
- Trigger: push to `master` and manual dispatch
- Deploy command: `wrangler pages deploy dist --project-name dr-stone-frontend --branch master`

Required repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

## Version and Upgrade Policy

- Keep Vue, Vite, and TypeScript versions in compatible major ranges.
- Upgrade dependencies in controlled increments and run full typecheck/build after each bump.
- Update this specification when tooling or architecture changes.
