#!/usr/bin/env bash
# Pull latest main on the Hetzner VPS, rebuild the app container, and apply DB migrations.
# Triggered from GitHub Actions on push to main (deploy-hetzner.yml).
#
# Run on the server:
#   cd /opt/app   # or your app directory
#   ./scripts/hetzner-deploy.sh
#
# Run from your laptop (SSH):
#   export HETZNER_USER=root
#   export HETZNER_APP_DIR=/opt/app
#   ./scripts/hetzner-deploy.sh
#
# Optional:
#   HETZNER_HOST — default 46.225.120.67
#   HETZNER_SKIP_PULL=1 — skip git pull (image rebuild + migrate only)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${HETZNER_HOST:-46.225.120.67}"
USER="${HETZNER_USER:-}"
APP_DIR="${HETZNER_APP_DIR:-}"
SKIP_PULL="${HETZNER_SKIP_PULL:-0}"

deploy_in_dir() {
  local app_dir="$1"
  cd "$app_dir"

  if [[ "$SKIP_PULL" != "1" ]]; then
    echo "==> Pulling latest code from main"
    git fetch origin main
    git checkout main
    git pull --ff-only origin main
  else
    echo "==> Skipping git pull (HETZNER_SKIP_PULL=1)"
  fi

  if [[ ! -f .env.production ]]; then
    echo "error: .env.production not found in ${app_dir}" >&2
    exit 1
  fi

  echo "==> Building and recreating app container"
  docker compose --env-file .env.production up -d --build --force-recreate app

  echo "==> Waiting for app to become healthy"
  sleep 8

  echo "==> Applying database migrations"
  docker compose exec -T app npx prisma migrate deploy

  echo ""
  echo "==> Verifying env inside container (values hidden):"
  docker compose exec -T app sh -c '
    for key in AUTH_SECRET SMTP_HOST SMTP_USER SMTP_PASS CRON_SECRET ADMIN_NOTIFICATION_EMAILS INSTAGRAM_USER_ID; do
      eval "value=\${$key:-}"
      if [ -n "$value" ]; then
        echo "  $key=set"
      else
        echo "  $key=MISSING"
      fi
    done
  '

  echo ""
  echo "==> Container status"
  docker compose ps

  echo ""
  echo "Deploy complete. Site: https://jackalsvolleyball.com"
}

if [[ -n "$USER" && -n "$APP_DIR" ]]; then
  REMOTE="${USER}@${HOST}"
  SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
  echo "==> Deploying on ${REMOTE}:${APP_DIR}"
  ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s <<EOF
set -euo pipefail
SKIP_PULL="${SKIP_PULL}"
$(declare -f deploy_in_dir)
deploy_in_dir "${APP_DIR}"
EOF
else
  deploy_in_dir "${APP_DIR:-$ROOT_DIR}"
fi
