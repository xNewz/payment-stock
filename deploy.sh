#!/usr/bin/env bash
# =============================================================================
#  deploy.sh — Zero-downtime deploy for payment-stock on VPS
#  Usage: bash deploy.sh
# =============================================================================
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="payment-stock"
LOG_DIR="$APP_DIR/logs"
BRANCH="${1:-main}"       # Pass branch as first argument, defaults to 'main'

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}   $1"; }
fail() { echo -e "${RED}[ERROR]${NC}  $1"; exit 1; }

# ── Pre-flight ────────────────────────────────────────────────────────────────
log "Starting deployment → branch: $BRANCH"
cd "$APP_DIR"

# Create log dir if not exist
mkdir -p "$LOG_DIR"

# ── 1. Pull latest code ───────────────────────────────────────────────────────
log "Pulling latest code from origin/$BRANCH..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
log "Code updated ✓"

# ── 2. Install dependencies ───────────────────────────────────────────────────
log "Installing npm dependencies..."
npm ci --omit=dev 2>&1 | tail -5
log "Dependencies installed ✓"

# ── 3. Run Prisma migrations ──────────────────────────────────────────────────
log "Updating database schema (db push)..."
npx prisma db push
log "Migrations applied ✓"

# ── 4. Generate Prisma client ─────────────────────────────────────────────────
log "Generating Prisma client..."
npx prisma generate
log "Prisma client generated ✓"

# ── 5. Build Next.js ──────────────────────────────────────────────────────────
log "Building Next.js production bundle..."
npm run build
log "Build complete ✓"

# ── 6. Reload PM2 (zero-downtime) ────────────────────────────────────────────
if pm2 list | grep -q "$APP_NAME"; then
  log "Reloading existing PM2 process '$APP_NAME'..."
  pm2 reload ecosystem.config.js --update-env
else
  log "Starting '$APP_NAME' for the first time..."
  pm2 start ecosystem.config.js
fi

# Save PM2 process list (survives reboots)
pm2 save

log "==========================================="
log " Deployment complete! App running on :8080"
log " PM2 status:"
pm2 list
