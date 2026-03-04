# Frontend Skills Guide

Last updated: 2026-03-04

This document defines the working skills and standards for the frontend team/agent before implementation starts.

## Start Order

1. Read `docs/TECHNOLOGY_SPEC.md`
2. Read `docs/FRONTEND_SPEC.md`
3. Read `docs/API_SPEC.md`
4. Implement UI/features using the rules below

## Core Frontend Skills

### 1) API-contract-first development

- Treat `docs/API_SPEC.md` as the contract source of truth.
- Create and maintain typed request/response models in `src/types/api.ts`.
- Do not invent fields on the client.
- Display backend `error` messages from non-2xx responses.

### 2) Vue architecture skill

- Use Vue 3 Composition API with `<script setup lang="ts">`.
- Keep route/root components as composition surfaces.
- Split feature responsibilities into focused child components.
- Keep stateful logic in composables (`src/composables/`).

### 3) TypeScript skill

- Keep API payloads and component contracts strongly typed.
- Avoid `any` in domain/UI state.
- Validate typecheck with `npm run typecheck`.

### 4) UI composition and styling skill

- Use shared design tokens from `src/styles.css`.
- Preserve responsive behavior for desktop and mobile.
- Keep visual hierarchy clear for operations-heavy screens.

### 5) Deployment skill

- Use Node `24.14.0` (`nvm use 24.14.0`).
- Ensure CI passes typecheck and build before deploy.
- Deploy through `.github/workflows/deploy.yml` to Cloudflare Pages.

## Definition of Ready (Before New Feature Work)

- Endpoint contract exists in `docs/API_SPEC.md`.
- UI behavior exists in `docs/FRONTEND_SPEC.md`.
- Technology/tooling constraints exist in `docs/TECHNOLOGY_SPEC.md`.

## Definition of Done (For Each Frontend Change)

- Typecheck passes.
- Build passes.
- UI behavior matches frontend spec.
- API usage matches API spec.
