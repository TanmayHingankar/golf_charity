# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Project: Golf Charity Subscription Platform ("Par for Purpose")

A subscription-driven web application combining golf performance tracking (Stableford scoring), charity fundraising, and a monthly draw-based reward engine.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion

## Artifacts

- **Golf Platform** (frontend): `/` — React/Vite app
- **API Server** (backend): `/api` — Express REST API

## Key Features

1. **Subscription System** — Monthly (£19.99) and Yearly (£199.99) plans with charity contribution (min 10%)
2. **Score Management** — Rolling 5-score system (Stableford 1-45), auto-replaces oldest
3. **Draw System** — Monthly draws with random/algorithmic generation; 5/4/3-number match tiers; jackpot rollover
4. **Prize Pool** — 40% jackpot, 35% 4-match, 25% 3-match; auto-calculated from active subscribers
5. **Charity Integration** — Charity directory with search, individual profiles, events, featured spotlight
6. **Independent Donations** — Direct donations to charities (not tied to gameplay), tracked in DB
7. **Winner Verification** — Proof upload (URL), admin approve/reject/mark-paid workflow
8. **Admin Dashboard** — Full analytics, user/draw/charity/winner management
9. **User Dashboard** — Subscription status, scores, charity, draws, winnings summary

## DB Schema

Tables: `users`, `subscriptions`, `scores`, `charities`, `charity_events`, `draws`, `winners`, `donations`

## Test Credentials

- **Admin**: admin@parforporpuse.com / Admin@123456
- **User**: Register a new account on `/register`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `cd artifacts/api-server && npx tsx src/seed.ts` — seed the database with charities and admin user

## Routes (Backend `/api`)

- `/auth` — register, login, logout, me (returns real subscription status)
- `/subscriptions` — CRUD + cancel
- `/scores` — my scores (rolling 5), admin user scores; future-date validation enforced
- `/charities` — list/get/create/update/delete, select charity, my charity
- `/draws` — list, create (admin), simulate (admin), publish (admin)
- `/winners` — my winnings, submit proof, admin verify/mark-paid
- `/admin` — stats, prize-pool
- `/dashboard` — summary (authenticated user dashboard data)
- `/donations` — create donation, my donations, admin all donations
- `/users/:userId/scores` — admin view/edit/delete individual user scores (new)

## Security

- **Helmet.js** — Full HTTP security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- **Rate Limiting** — Global: 300 req/15min; Auth endpoints: 20 req/15min
- **JWT** — `SESSION_SECRET` env var enforced in production; insecure fallback only in dev
- **Score date validation** — Server-side rejection of future dates
- **Auth guard** — All admin/authenticated routes protected with JWT middleware

## Admin Features

- User management with expandable score panel (view, edit, delete individual scores)
- Real subscription status shown for each user (live DB lookup)
- Admin score editing enforces same validation as user score submission

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
