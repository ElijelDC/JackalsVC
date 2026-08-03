# Jackals VC — Volleyball Club Website

Production site for **Jackals Volleyball Club**: [jackalsvolleyball.com](https://jackalsvolleyball.com)

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes |
| Database | SQLite via Prisma ORM 7 |
| Auth | NextAuth.js v5 (credentials) |
| Hosting | Hetzner VPS (Docker Compose + Caddy); Fly.io config also in repo |

## Deploy

Production runs on **Hetzner** — see **[docs/HETZNER-DEPLOY.md](./docs/HETZNER-DEPLOY.md)**.

Legacy Fly.io setup: **[DEPLOY.md](./DEPLOY.md)**. DNS: **[docs/CLOUDFLARE-DNS.md](./docs/CLOUDFLARE-DNS.md)**.

```bash
# Hetzner — after editing .env.production
./scripts/hetzner-deploy-env.sh
```

Migrations run automatically on container start (`prisma db push` via entrypoint).

## Environment variables

Copy `.env.example` to `.env` for local runs. On Hetzner, use `.env.production` (see docs/HETZNER-DEPLOY.md). On Fly, set secrets via `fly secrets set` (see DEPLOY.md).

Required in production:

- `AUTH_SECRET`
- `DATABASE_URL` (Fly: `file:/data/jackals.db`)
- `NEXT_PUBLIC_SITE_URL` (`https://jackalsvolleyball.com`)
- `SMTP_*` — registration verification and contact form

## Local development

Dev server runs on **port 3005** (not 3000).

**First time (or fresh clone):**

```bash
npm run dev:setup
```

This runs `npm install`, creates `.env` from `.env.example` (with a generated `AUTH_SECRET`), applies Prisma migrations, and starts the dev server at [http://localhost:3005](http://localhost:3005).

**Manual setup:**

```bash
npm install
cp .env.example .env
# Set AUTH_SECRET — e.g. openssl rand -base64 32
npx prisma generate
npx prisma migrate deploy   # or: npx prisma db push
npm run dev
```

**Public pages to spot-check:**

- [http://localhost:3005/membership/2026-27](http://localhost:3005/membership/2026-27) — season fees breakdown (no login)

## Local production build

```bash
npm install
npm run db:migrate    # first-time local schema only
npm run build
npm run start
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port **3005** |
| `npm run dev:setup` | Install deps, create `.env`, migrate DB, start dev |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:deploy` | Apply migrations (production / CI) |
| `npm run db:migrate` | Create migrations during development |

## Project structure

```
src/
├── app/           # Pages and API routes
├── components/    # UI components
├── generated/     # Prisma client
└── lib/           # Shared server utilities
prisma/
├── schema.prisma
└── migrations/
```

## License

Private — Jackals Volleyball Club
