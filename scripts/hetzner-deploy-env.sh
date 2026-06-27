#!/usr/bin/env bash
# Upload .env.production to the Hetzner server and recreate the app container
# so Docker Compose picks up the new values.
#
# Required environment variables:
#   HETZNER_HOST   — server IP or hostname (default: 46.225.120.67)
#   HETZNER_USER   — SSH user (no default; e.g. root or deploy)
#   HETZNER_APP_DIR — app directory on the server (e.g. /root/JackalsVC)
#
# Optional:
#   HETZNER_ENV_FILE — local env file to upload (default: .env.production)
#   HETZNER_REBUILD  — set to 1 to rebuild the image (needed for NEXT_PUBLIC_* changes)
#
# Example:
#   HETZNER_USER=root HETZNER_APP_DIR=/root/JackalsVC ./scripts/hetzner-deploy-env.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${HETZNER_ENV_FILE:-$ROOT_DIR/.env.production}"
HOST="${HETZNER_HOST:-46.225.120.67}"
USER="${HETZNER_USER:-}"
APP_DIR="${HETZNER_APP_DIR:-}"
REBUILD="${HETZNER_REBUILD:-0}"

if [[ -z "$USER" || -z "$APP_DIR" ]]; then
  echo "error: set HETZNER_USER and HETZNER_APP_DIR before running this script." >&2
  echo "  export HETZNER_USER=root" >&2
  echo "  export HETZNER_APP_DIR=/path/to/JackalsVC" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: env file not found: $ENV_FILE" >&2
  echo "  Copy .env.example to .env.production and fill in production values first." >&2
  exit 1
fi

REMOTE="${USER}@${HOST}"
SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [[ -n "${SSH_AUTH_SOCK:-}" ]]; then
  export SSH_AUTH_SOCK
fi

echo "==> Uploading $(basename "$ENV_FILE") to ${REMOTE}:${APP_DIR}/"
scp "${SSH_OPTS[@]}" "$ENV_FILE" "${REMOTE}:${APP_DIR}/.env.production"

BUILD_FLAG=""
if [[ "$REBUILD" == "1" ]]; then
  BUILD_FLAG="--build"
  echo "==> Rebuilding image (NEXT_PUBLIC_* or code changes)"
fi

echo "==> Recreating app container with new environment"
ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s <<EOF
set -euo pipefail
cd "${APP_DIR}"
docker compose --env-file .env.production up -d ${BUILD_FLAG} --force-recreate app
echo ""
echo "==> Verifying required env vars inside the running container (values hidden):"
docker compose exec -T app sh -c '
  for key in AUTH_SECRET SMTP_HOST SMTP_USER SMTP_PASS INSTAGRAM_USER_ID INSTAGRAM_ACCESS_TOKEN SUMUP_API_KEY; do
    eval "value=\${$key:-}"
    if [ -n "$value" ]; then
      echo "  $key=set"
    else
      echo "  $key=MISSING"
    fi
  done
'
EOF

echo ""
echo "Done. Env changes are live after container recreate."
