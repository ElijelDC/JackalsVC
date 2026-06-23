# Jackals VC — Volleyball Club Website

Production site for **Jackals Volleyball Club**: [jackalsvolleyball.com](https://jackalsvolleyball.com)

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes |
| Database | SQLite via Prisma ORM 7 |
| Auth | NextAuth.js v5 (credentials) |
| Hosting | Fly.io (Docker, persistent volume) |

## Deploy

See **[DEPLOY.md](./DEPLOY.md)** for Fly.io setup and **[docs/CLOUDFLARE-DNS.md](./docs/CLOUDFLARE-DNS.md)** for domain DNS.

```bash
fly deploy
```

Migrations run automatically on container start (`prisma migrate deploy`).

## Environment variables

Copy `.env.example` to `.env` for local runs. On Fly, set secrets via `fly secrets set` (see DEPLOY.md).

Required in production:

- `AUTH_SECRET`
- `DATABASE_URL` (Fly: `file:/data/jackals.db`)
- `NEXT_PUBLIC_SITE_URL` (`https://jackalsvolleyball.com`)
- `SMTP_*` — registration verification and contact form

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
