#!/bin/bash
# Paste this entire script into Hetzner Console → your server → Console tab.
set -e

mkdir -p ~/.ssh
chmod 700 ~/.ssh
grep -qF 'rost.ovtseva226@gmail.com' ~/.ssh/authorized_keys 2>/dev/null || \
  echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILwDCm+VnjCOnnn3MA82rPy+QTMLaGCI14nJ7ZQrjnWD rost.ovtseva226@gmail.com' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

APP_DIR="${APP_DIR:-/opt/jackalsvc}"
mkdir -p "$APP_DIR"

cat > "$APP_DIR/.env.production" <<'EOF'
DATABASE_URL="file:/data/jackals.db"
DATA_DIR="/data"
AUTH_SECRET="Yjl8Dif/+RyW7kk6RGmRS+ilz/uUeN98lLH570EZTiY="
AUTH_URL="https://jackalsvolleyball.com"
NEXT_PUBLIC_SITE_URL="https://jackalsvolleyball.com"
CLUB_IBAN="IE89SUMU99036511293898"
CLUB_ACCOUNT_HOLDER="Thunder Jackals"
SUMUP_API_KEY="sup_sk_OpzU1A51c8XsJCScwZPxiFVOQfs8pa2Xz"
SUMUP_MERCHANT_CODE="MDFNZHPR"
PAYMENTS_SYNC_SECRET=""
PAYMENT_EMAIL_WEBHOOK_SECRET="jackals-email-webhook-dev"
PAYMENT_EMAIL_ALLOWED_SENDERS="sumup.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="jackalsvolleyballclub@gmail.com"
SMTP_PASS="cttpdmqsypbxjzaq"
SMTP_FROM="jackalsvolleyballclub@gmail.com"
INSTAGRAM_USER_ID="17841467391808908"
INSTAGRAM_ACCESS_TOKEN="IGAAMSwCKNlZAtBZAGJiaXYtc1kySS02WTVFWERHeVdrMW42dF9tdXNZAQm1PVVg5WHRBZAEx6RUFzanQxMFN6UHRDc0YtUEdCcmt0Y04xd2R2Y2xyUjA3OEE3NWFBSTdVMTNIV3RqV2RaQ01wQlRKeG1iZAV9mQVc5aDNObkF4UlZAzbwZDZD"
EOF
chmod 600 "$APP_DIR/.env.production"

if [ -f "$APP_DIR/docker-compose.yml" ]; then
  cd "$APP_DIR"
  docker compose up -d
  echo "Restarted docker compose in $APP_DIR"
else
  echo "Wrote $APP_DIR/.env.production — clone repo here and run: docker compose up -d --build"
fi

echo "SSH key authorized. .env.production ready."
