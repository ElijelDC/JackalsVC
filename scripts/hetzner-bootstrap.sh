#!/bin/bash
# Paste this entire script into Hetzner Console → your server → Console tab.
# Set secrets via environment variables before running — never commit real values.
set -e

: "${AUTH_SECRET:?Set AUTH_SECRET before running}"
: "${SMTP_PASS:?Set SMTP_PASS before running}"
: "${SUMUP_API_KEY:?Set SUMUP_API_KEY before running}"

SSH_PUBLIC_KEY="${SSH_PUBLIC_KEY:-}"
APP_DIR="${APP_DIR:-/opt/jackalsvc}"

if [ -n "$SSH_PUBLIC_KEY" ]; then
  mkdir -p ~/.ssh
  chmod 700 ~/.ssh
  grep -qF "$SSH_PUBLIC_KEY" ~/.ssh/authorized_keys 2>/dev/null || \
    echo "$SSH_PUBLIC_KEY" >> ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys
fi

mkdir -p "$APP_DIR"

cat > "$APP_DIR/.env.production" <<EOF
DATABASE_URL="file:/data/jackals.db"
DATA_DIR="/data"
AUTH_SECRET="${AUTH_SECRET}"
AUTH_URL="${AUTH_URL:-https://jackalsvolleyball.com}"
NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://jackalsvolleyball.com}"
CLUB_IBAN="${CLUB_IBAN:-}"
CLUB_ACCOUNT_HOLDER="${CLUB_ACCOUNT_HOLDER:-Thunder Jackals}"
SUMUP_API_KEY="${SUMUP_API_KEY}"
SUMUP_MERCHANT_CODE="${SUMUP_MERCHANT_CODE:-}"
PAYMENTS_SYNC_SECRET="${PAYMENTS_SYNC_SECRET:-}"
PAYMENT_EMAIL_WEBHOOK_SECRET="${PAYMENT_EMAIL_WEBHOOK_SECRET:-}"
PAYMENT_EMAIL_ALLOWED_SENDERS="${PAYMENT_EMAIL_ALLOWED_SENDERS:-sumup.com}"
CRON_SECRET="${CRON_SECRET:-}"
SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-}"
SMTP_PASS="${SMTP_PASS}"
SMTP_FROM="${SMTP_FROM:-}"
INSTAGRAM_USER_ID="${INSTAGRAM_USER_ID:-}"
INSTAGRAM_ACCESS_TOKEN="${INSTAGRAM_ACCESS_TOKEN:-}"
EOF
chmod 600 "$APP_DIR/.env.production"

if [ -f "$APP_DIR/docker-compose.yml" ]; then
  cd "$APP_DIR"
  docker compose up -d
  echo "Restarted docker compose in $APP_DIR"
else
  echo "Wrote $APP_DIR/.env.production — clone repo here and run: docker compose up -d --build"
fi

echo "Bootstrap complete. .env.production ready."
