# Playwright E2E Tests — Gym SaaS Platform

Browser-based end-to-end tests for the Angular frontend.

## Prerequisites

1. **Backend API** running at `http://localhost:5088` (Angular proxy forwards `/api` to this port).
2. **Demo data** seeded (Super Admin, FitZone Demo Gym, Gym Admin).
3. Copy `e2e/.env.example` to `e2e/.env.local` and adjust credentials if needed.

## Install browsers

```bash
npm run e2e:install
```

## Run tests

```bash
# All browsers (Chromium, Firefox, Edge, Chrome)
npm run e2e

# Single browser
npm run e2e:chromium
npm run e2e:firefox
npm run e2e:edge
npm run e2e:chrome

# Interactive UI mode
npm run e2e:ui

# Headed (visible browser)
npm run e2e:headed

# Run a specific suite
npx playwright test e2e/auth
npx playwright test e2e/tenant-menus
npx playwright test e2e/members
```

Playwright starts `ng serve` automatically unless a server is already running on port 4200.

## Reports

```bash
# Open HTML report after a run
npm run e2e:report

# JSON results are written to test-results/results.json
```

Artifacts on failure: screenshots, videos, and traces (on retry) under `test-results/`.

## Folder structure

```
e2e/
├── auth/              # Login / logout
├── tenant-menus/      # Super Admin tenant menu management
├── members/           # Member CRUD flows
├── trainers/
├── leads/
├── memberships/
├── payments/
├── attendance/
├── diet-plans/
├── workout-plans/
├── notifications/
├── reports/
├── analytics/
├── branches/
├── white-label/
├── public-website/
└── shared/            # Helpers, fixtures, env
```

## Shared helpers

| Helper | Purpose |
|--------|---------|
| `login.helper.ts` | Super Admin / Gym Admin login |
| `logout.helper.ts` | Header menu logout |
| `navigation.helper.ts` | Routes and sidebar checks |
| `test-data.helper.ts` | Unique IDs, passwords, dates |
| `screenshot.helper.ts` | Named full-page captures |
| `api.helper.ts` | API login and tenant menu setup/teardown |
| `fixtures.ts` | Console + network logging, failure screenshots |
