#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/data}"
UPLOADS_DIR="${DATA_DIR}/uploads"

mkdir -p "${UPLOADS_DIR}/payment-proofs"
mkdir -p "${UPLOADS_DIR}/gallery"
mkdir -p "${UPLOADS_DIR}/achievements"
mkdir -p "${UPLOADS_DIR}/profile-images"
mkdir -p "${UPLOADS_DIR}/vly-membership-photos"
mkdir -p "${UPLOADS_DIR}/coach-invoices"

# Persist member uploads on the Fly volume (SQLite lives at /data/jackals.db).
if [ -L /app/public/uploads ]; then
  :
elif [ -d /app/public/uploads ]; then
  rm -rf /app/public/uploads
  ln -sf "${UPLOADS_DIR}" /app/public/uploads
else
  ln -sf "${UPLOADS_DIR}" /app/public/uploads
fi

cd /app

echo "Applying database schema..."
if ! npx prisma migrate deploy; then
  echo "migrate deploy skipped or failed — syncing schema with db push..."
  npx prisma db push --accept-data-loss
fi

echo "Starting Jackals VC..."
exec npm start
