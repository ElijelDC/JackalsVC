#!/usr/bin/env bash
# Trigger a full Reclub sync inside the production app container.
# Intended for host crontab on the Hetzner VPS (every 15–30 minutes).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env.production ]]; then
  echo "error: .env.production not found in ${ROOT_DIR}" >&2
  exit 1
fi

docker compose --env-file .env.production exec -T app node -e "
fetch('http://127.0.0.1:3000/api/cron/reclub-sync', {
  method: 'POST',
  headers: { 'x-cron-secret': process.env.CRON_SECRET },
})
  .then(async (response) => {
    const body = await response.text();
    if (!response.ok) {
      console.error('Reclub sync failed:', response.status, body);
      process.exit(1);
    }
    console.log(body);
  })
  .catch((error) => {
    console.error('Reclub sync request failed:', error);
    process.exit(1);
  });
"
