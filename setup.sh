#!/usr/bin/env bash
# =============================================================================
#  setup.sh — First-time VPS setup for payment-stock
#  Tested on: Ubuntu 22.04 / Debian 12
#  Usage: bash setup.sh
# =============================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }

# ── 1. System update ──────────────────────────────────────────────────────────
log "Updating system packages..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq

# ── 2. Install Node.js 22 (LTS) via NodeSource ───────────────────────────────
if ! command -v node &>/dev/null; then
  log "Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  log "Node.js $(node -v) already installed ✓"
fi

# ── 3. Install PM2 globally ───────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  log "Installing PM2..."
  sudo npm install -g pm2
  # Auto-start PM2 on boot
  pm2 startup | tail -1 | sudo bash || warn "Run 'pm2 startup' manually if this failed"
else
  log "PM2 $(pm2 -v) already installed ✓"
fi

# ── 4. Install project dependencies ──────────────────────────────────────────
log "Installing project dependencies..."
cd "$APP_DIR"
npm ci --omit=dev

# ── 5. Setup .env if not exists ───────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  warn ".env file not found! Creating from .env.example..."
  if [ -f "$APP_DIR/.env.example" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    warn "IMPORTANT: Edit .env with your real values before proceeding!"
    warn "  nano $APP_DIR/.env"
    exit 1
  else
    fail "No .env or .env.example found. Create .env manually."
  fi
else
  log ".env file found ✓"
fi

# ── 6. Run Prisma migrations ──────────────────────────────────────────────────
log "Running Prisma migrations..."
npx prisma migrate deploy
npx prisma generate
log "Database ready ✓"

# ── 7. Build Next.js ──────────────────────────────────────────────────────────
log "Building Next.js for production..."
npm run build
log "Build complete ✓"

# ── 8. Create log directory ───────────────────────────────────────────────────
mkdir -p "$APP_DIR/logs"

# ── 9. Start app with PM2 ────────────────────────────────────────────────────
log "Starting app with PM2..."
pm2 start ecosystem.config.js
pm2 save

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
log "============================================================"
log " Setup complete!"
log ""
log " App is running on port 8080"
log " Cloudflare Tunnel should proxy → localhost:8080"
log ""
log " Useful commands:"
log "   pm2 status              — check process status"
log "   pm2 logs payment-stock  — tail logs"
log "   pm2 reload ecosystem.config.js — hot reload"
log "   bash deploy.sh          — pull & deploy updates"
log "============================================================"
