# Deploying Jackals VC on Hetzner

Production runs at **jackalsvolleyball.com** on a Hetzner VPS (`46.225.120.67`) using **Docker Compose** + **Caddy** for HTTPS.

## Why env changes don't show up immediately

Copying `.env.production` to the server is **not enough**. Docker Compose reads `env_file` only when a container is **created**. A plain `docker compose restart` keeps the old environment.

After updating secrets you must **recreate** the app container:

```bash
cd /path/to/JackalsVC
docker compose --env-file .env.production up -d --force-recreate app
```

If you changed `NEXT_PUBLIC_*` variables (baked into the Next.js client bundle at build time), rebuild as well:

```bash
docker compose --env-file .env.production up -d --build --force-recreate app
```

## Server layout

On the VPS, the repo should contain at least:

```
JackalsVC/
├── docker-compose.yml
├── Caddyfile
├── .env.production      ← secrets (never commit)
└── ...
```

`docker-compose.yml` loads secrets from `.env.production` via `env_file`.

## First-time server setup

```bash
# On the Hetzner VPS
git clone https://github.com/ElijelDC/JackalsVC.git
cd JackalsVC
cp .env.example .env.production
# Edit .env.production with production values (AUTH_SECRET, SMTP_*, etc.)

docker compose --env-file .env.production up -d --build
```

Point Cloudflare DNS A record for `@` and `www` to `46.225.120.67`. Caddy obtains Let's Encrypt certificates automatically.

## Updating environment variables

### From your laptop (with SSH access)

```bash
# 1. Edit secrets locally
cp .env.example .env.production   # if needed
# fill in values...

# 2. Upload and apply
export HETZNER_USER=root
export HETZNER_APP_DIR=/root/JackalsVC   # adjust to your server path
./scripts/hetzner-deploy-env.sh

# For NEXT_PUBLIC_* changes:
HETZNER_REBUILD=1 ./scripts/hetzner-deploy-env.sh
```

### Directly on the server

```bash
ssh root@46.225.120.67
cd /root/JackalsVC          # adjust path
nano .env.production
docker compose --env-file .env.production up -d --force-recreate app
```

## Required production variables

See `.env.example`. Minimum for a working site:

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Session signing (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_SITE_URL` | `https://jackalsvolleyball.com` |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Registration verification emails |
| `SMTP_FROM` | From address for outbound mail |

Optional:

| Variable | Purpose |
|----------|---------|
| `INSTAGRAM_USER_ID`, `INSTAGRAM_ACCESS_TOKEN` | Homepage Instagram feed |
| `SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE` | Payment reconciliation |
| `CLUB_IBAN`, `CLUB_ACCOUNT_HOLDER` | Membership payment instructions |

## Cursor Cloud Agent setup

To let a Cloud Agent upload env vars for you, configure in **Cursor → Cloud Agents → Secrets / Environment**:

1. **SSH key** — private key that can log into the Hetzner VPS (add the matching public key to the server’s `~/.ssh/authorized_keys`).
2. **Environment variables** for the deploy script:
   - `HETZNER_USER` (e.g. `root`)
   - `HETZNER_APP_DIR` (e.g. `/root/JackalsVC`)
   - Optionally `HETZNER_HOST` if the IP changes
3. **Env file content** — either paste secrets as individual env vars and have the agent write `.env.production`, or provide the full file in the agent prompt.

The agent must run `./scripts/hetzner-deploy-env.sh` after writing `.env.production`; uploading alone will not apply changes.

## Verify env is loaded

On the server:

```bash
docker compose exec app sh -c 'test -n "$AUTH_SECRET" && echo AUTH_SECRET=ok || echo AUTH_SECRET=missing'
docker compose exec app sh -c 'test -n "$SMTP_HOST" && echo SMTP=ok || echo SMTP=missing'
docker compose logs app --tail 50
```

Homepage Instagram section only appears when `INSTAGRAM_USER_ID` and `INSTAGRAM_ACCESS_TOKEN` are set.

## Email notifications & the reminder cron

Transactional and notification emails use the same `SMTP_*` settings as registration verification. Two extra variables tune notifications:

| Variable | Purpose |
|----------|---------|
| `ADMIN_NOTIFICATION_EMAILS` | Comma-separated admin recipients. If unset, every `ADMIN` user is emailed. |
| `CRON_SECRET` | Shared secret for the membership-due reminder endpoint. |

Membership "payment due" reminders (a week ahead, then the day before) are sent by `POST /api/cron/membership-due`. It is idempotent, so it is safe to run daily. Wire it up with a host crontab on the VPS:

```bash
# crontab -e  (runs every day at 09:00)
0 9 * * * curl -fsS -X POST https://jackalsvolleyball.com/api/cron/membership-due -H "x-cron-secret: $CRON_SECRET" >/dev/null 2>&1
```

(Replace `$CRON_SECRET` with the value you set in `.env.production`.)

## Day-to-day commands

| Command | Purpose |
|---------|---------|
| `docker compose ps` | Container status |
| `docker compose logs -f app` | App logs |
| `docker compose pull && docker compose --env-file .env.production up -d --build` | Deploy code updates |
| `docker compose exec app npx prisma db push` | Apply schema changes |

## Architecture

```
Internet → Caddy :443 → app:3000 (Next.js)
                            ├── /data/jackals.db   (SQLite volume)
                            └── /data/uploads/     (member files)
```
