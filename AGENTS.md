<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Next.js 16 + React 19 app with Prisma 7 / SQLite (`better-sqlite3`) and NextAuth v5 (credentials). Standard scripts live in `package.json`; setup/run details are in `README.md`.

- **Required `.env`**: not committed (gitignored). It must exist with `DATABASE_URL="file:./dev.db"`, `AUTH_SECRET` (any value; generate via `openssl rand -base64 32`), and `NEXT_PUBLIC_SITE_URL="http://localhost:3000"`. The SQLite DB lives at `dev.db` in the repo root (not `prisma/dev.db`).
- **Database setup — do NOT use `prisma migrate deploy`/`npm run db:migrate`**: the committed migration history is mis-ordered (the table-creating `init` migration is timestamped after migrations that `ALTER` those tables), so migrations fail with `no such table`. For dev, sync the schema directly from `prisma/schema.prisma` with `npx prisma db push`, then `npm run db:seed`. The `.env` and seeded `dev.db` persist in the VM snapshot, so this is normally already done.
- **Run the app**: `npm run dev` (Turbopack dev server on http://localhost:3000). Demo accounts (from seed) use password `password123`; admin is `admin@jackalsvc.com`.
- **Shop is feature-flagged off**: `SHOP_ENABLED = false` in `src/lib/features.ts`, so `/shop` returns 404 by design. Pages like `/training`, `/membership`, `/dashboard`, `/calendar` redirect to `/login` when unauthenticated (307) — this is expected, not a bug.
- **Lint** (`npm run lint`) currently reports pre-existing errors/warnings in app code; the command itself works.
