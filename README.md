# Gym Management UI

Angular 19 single-page application for the Gym Management System.

**Backend API repository:** [Gym-Management-API](https://github.com/Guruprasad-93/Gym-Management-API)

## Prerequisites

- Node.js 20+
- [Gym Management API](https://github.com/Guruprasad-93/Gym-Management-API) running at `http://localhost:5088`

## Quick start

```bash
npm install
npm start
```

Open http://localhost:4200 — API calls are proxied to `http://localhost:5088/api` via `proxy.conf.json`.

## Build

```bash
npm run build
```

Production output: `dist/gym-app/`

## Portals

| Route | Role |
|-------|------|
| `/auth/login` | Login |
| `/super-admin` | Platform admin |
| `/gym-admin` | Gym manager |
| `/trainer` | Trainer |
| `/member` | Member |
| `/website/:slug` | Public gym website |

## Demo credentials

See the API repository README for seeded demo accounts.
