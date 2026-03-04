# Dr. Stone Frontend

Frontend repository for Dr. Stone dashboard UI.

## Scope

This project contains:

- frontend application code (Vue 3 + TypeScript)
- frontend-specific API contracts and usage docs
- frontend deployment pipeline for Cloudflare Pages

Backend/API code remains in sibling repository: `../dr-stone`.

## Local Development

```bash
nvm use 24.14.0
```

```bash
npm install
npm run dev
```

Create `.env.local` when needed:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8787
```

## Build

```bash
npm run typecheck
npm run build
```

## Docs

- `docs/TECHNOLOGY_SPEC.md`
- `docs/FRONTEND_SPEC.md`
- `docs/API_SPEC.md`
- `docs/FRONTEND_SKILLS.md`

## Deploy

GitHub Actions deploy workflow: `.github/workflows/deploy.yml`

Required repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
