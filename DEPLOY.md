# Deploying Jackals VC on Fly.io

This app uses **SQLite** and **local file uploads**, so it runs on Fly.io as a **single machine with a persistent volume** (not serverless).

Estimated cost: about **$5–7/month** (512 MB VM + 1 GB volume) for ~50 members.

## Prerequisites

- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed and logged in (`fly auth login`)
- Domain ready (e.g. `jackalsvolleyball.com`) — optional on first deploy
- Production values for `AUTH_SECRET`, SMTP, etc.

## First-time setup

### 1. Create the Fly app

From the project root:

```bash
# Optional: change app name in fly.toml if jackals-vc is taken
fly apps create jackals-vc
```

Or run `fly launch --no-deploy` and accept/adjust the generated config (keep the volume mount from `fly.toml`).

### 2. Create the persistent volume

**Must be in the same region as `primary_region` in `fly.toml` (default: `fra`).**

```bash
fly volumes create jackals_data --region fra --size 1
```

### 3. Set secrets

Do **not** commit real secrets. Set them on Fly:

```bash
fly secrets set \
  AUTH_SECRET="$(openssl rand -base64 32)" \
  SMTP_HOST="smtp.gmail.com" \
  SMTP_PORT="587" \
  SMTP_USER="your@email.com" \
  SMTP_PASS="your-app-password" \
  SMTP_FROM="your@email.com" \
  CLUB_IBAN="IE..." \
  CLUB_ACCOUNT_HOLDER="Jackals VC"
```

Add optional secrets as needed:

```bash
fly secrets set SUMUP_API_KEY="..." SUMUP_MERCHANT_CODE="..."
fly secrets set INSTAGRAM_USER_ID="..." INSTAGRAM_ACCESS_TOKEN="..."
```

`DATABASE_URL` and `NEXT_PUBLIC_SITE_URL` are set in `fly.toml` `[env]`. Update the site URL there (or via `fly secrets set`) before going live.

### 4. Deploy

```bash
fly deploy
```

On each deploy, the container:

1. Links `public/uploads` → `/data/uploads` on the volume  
2. Runs `prisma migrate deploy`  
3. Starts `npm start`

### 5. Custom domain + HTTPS (Cloudflare)

Your domain **jackalsvolleyball.com** is on Cloudflare. Full step-by-step DNS setup:

**[docs/CLOUDFLARE-DNS.md](./docs/CLOUDFLARE-DNS.md)**

Quick version:

```bash
fly certs add jackalsvolleyball.com
fly certs add www.jackalsvolleyball.com
fly certs show jackalsvolleyball.com   # copy DNS records into Cloudflare
```

In Cloudflare DNS, point `@` and `www` at Fly (see the doc). Set SSL/TLS to **Full (strict)**.

Verify:

```bash
fly certs check jackalsvolleyball.com
```

`NEXT_PUBLIC_SITE_URL` is already `https://jackalsvolleyball.com` in `fly.toml`.

### 6. Create the first admin

Register through the normal sign-up flow, then set the user role to `ADMIN` in the database (or via an existing admin account once one exists).

Do not use demo credentials in production.

## Day-to-day commands

| Command | Purpose |
|---------|---------|
| `fly deploy` | Build image and release |
| `fly logs` | Tail application logs |
| `fly status` | App and machine health |
| `fly ssh console` | Shell into the running machine |
| `fly volumes list` | Check attached storage |

### Run migrations manually

```bash
fly ssh console -C "cd /app && npx prisma migrate deploy"
```

### Backup SQLite + uploads

```bash
# SSH in, then copy from the volume
fly ssh console
ls -la /data
# jackals.db and uploads/ live here
```

For regular backups, snapshot the volume or copy `/data` to object storage (e.g. R2, B2).

## Local Docker test (optional)

```bash
docker build -t jackals-vc .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="file:/tmp/jackals.db" \
  -e DATA_DIR="/tmp" \
  -e AUTH_SECRET="local-test-secret" \
  -e NEXT_PUBLIC_SITE_URL="http://localhost:3000" \
  -v "$(pwd)/.fly-data:/data" \
  jackals-vc
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Machine won’t start | `fly logs` — often migration or missing `AUTH_SECRET` |
| Uploads disappear after restart | Volume not mounted; check `fly.toml` `[[mounts]]` and `fly volumes list` |
| Emails not sending | Set SMTP secrets; check `fly logs` for mail errors |
| Auth redirect wrong | Set `NEXT_PUBLIC_SITE_URL` to your HTTPS domain |
| `better-sqlite3` build fails | Dockerfile installs `python3`, `make`, `g++` — rebuild with `fly deploy --no-cache` |

## Architecture

```
Internet → Fly proxy (HTTPS) → Machine :3000
                                    ├── /data/jackals.db      (SQLite)
                                    └── /data/uploads/        (member files)
                                    public/uploads → symlink
```

**Single machine only** — do not scale to multiple instances without migrating to PostgreSQL and external object storage.
