#!/usr/bin/env bash
# Install jackalsvc_ed25519 (or KEY_FILE) into root authorized_keys via Hetzner rescue mode.
#
# Prerequisite (Hetzner Cloud UI — ~1 min):
#   1. Server → Rescue → Linux 64 → Activate (copy the RESCUE password shown)
#   2. Power → Reboot
#   3. Wait ~60s, then run this script with RESCUE_PASSWORD set
#
# Usage:
#   RESCUE_PASSWORD='...' ./scripts/hetzner-rescue-install-key.sh
#   RESCUE_PASSWORD='...' KEY_FILE=~/.ssh/jackalsvc_ed25519.pub ./scripts/hetzner-rescue-install-key.sh
#
# After success:
#   4. Hetzner → Rescue → Disable → Reboot
#   5. ssh -i ~/.ssh/jackalsvc_ed25519 root@46.225.120.67
#   6. ./scripts/hetzner-deploy.sh  (or GitHub Actions → Deploy to Hetzner)
set -euo pipefail

HOST="${HETZNER_HOST:-46.225.120.67}"
USER="${HETZNER_USER:-root}"
KEY_FILE="${KEY_FILE:-$HOME/.ssh/jackalsvc_ed25519.pub}"
RESCUE_PASSWORD="${RESCUE_PASSWORD:-}"

if [[ -z "$RESCUE_PASSWORD" ]]; then
  echo "error: set RESCUE_PASSWORD (from Hetzner → Rescue → Activate, not the normal root password)." >&2
  exit 1
fi

if [[ ! -f "$KEY_FILE" ]]; then
  echo "error: public key not found: $KEY_FILE" >&2
  exit 1
fi

if ! command -v expect >/dev/null 2>&1; then
  echo "error: expect is required (macOS: pre-installed)." >&2
  exit 1
fi

PUBKEY="$(cat "$KEY_FILE")"

echo "==> Installing SSH key on $USER@$HOST (rescue mode)"
echo "    Key: $KEY_FILE"

expect <<EOF
set timeout 120
spawn ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no -o StrictHostKeyChecking=accept-new ${USER}@${HOST} bash
expect {
  -re "(?i)password:" { send "${RESCUE_PASSWORD}\r" }
  timeout { puts "\nerror: timeout waiting for password prompt"; exit 1 }
}
expect {
  -re "Permission denied" { puts "\nerror: rescue password rejected"; exit 1 }
  -re "\\\$|#" { }
  timeout { }
}

send "set -e\r"
expect -re "\\\$|#"

send "lsblk\r"
expect -re "\\\$|#"

send "ROOT_DEV=\$(lsblk -ln -o NAME,TYPE,MOUNTPOINT | awk '\\\$2==\"part\" && \\\$3==\"/\" {print \"/dev/\"\\\$1; exit}')\r"
expect -re "\\\$|#"

send "if [[ -z \"\\\$ROOT_DEV\" ]]; then ROOT_DEV=\$(lsblk -ln -o NAME,TYPE | awk '\\\$2==\"part\" {print \"/dev/\"\\\$1; exit}'); fi\r"
expect -re "\\\$|#"

send "echo Using root partition: \\\$ROOT_DEV\r"
expect -re "\\\$|#"

send "mkdir -p /mnt\r"
expect -re "\\\$|#"

send "mount \"\\\$ROOT_DEV\" /mnt\r"
expect -re "\\\$|#"

send "mkdir -p /mnt/root/.ssh && chmod 700 /mnt/root/.ssh\r"
expect -re "\\\$|#"

send "grep -qF '${PUBKEY}' /mnt/root/.ssh/authorized_keys 2>/dev/null || echo '${PUBKEY}' >> /mnt/root/.ssh/authorized_keys\r"
expect -re "\\\$|#"

send "chmod 600 /mnt/root/.ssh/authorized_keys\r"
expect -re "\\\$|#"

send "umount /mnt\r"
expect -re "\\\$|#"

send "echo KEY_INSTALLED_OK\r"
expect "KEY_INSTALLED_OK"

send "exit\r"
expect eof
EOF

echo ""
echo "==> Key installed. Now in Hetzner Cloud:"
echo "    1. Rescue → Disable"
echo "    2. Power → Reboot"
echo "    3. Test: ssh -i ${KEY_FILE%.pub} ${USER}@${HOST}"
echo "    4. Deploy: ./scripts/hetzner-deploy.sh"
