# Deploy Reference

Loaded only when shipping. The main `SKILL.md` summarises this — read here for the full procedure.

## Prerequisites

- `sshpass` installed locally (`brew install hudochenkov/sshpass/sshpass`)
- VM is reachable on the local network or via Tailscale (`100.103.216.30`)

## The Three Commands

### 1. Sync changed files

Always use `--relative` so local paths map 1:1 to the VM:

```bash
sshpass -p 'tabezazaza123' rsync -avz --relative \
  app/api/auth/login/route.js \
  lib/auth.js \
  components/aurora-background.js \
  payment@100.103.216.30:/home/payment/payment-stock/
```

- List **only** files you actually changed — full-tree rsync overwrites in-progress work on the VM
- The trailing slash on the destination matters
- Output should report each file; if rsync says "0 files transferred" you forgot to save

### 2. Build (must succeed)

```bash
sshpass -p 'tabezazaza123' ssh payment@100.103.216.30 \
  "cd /home/payment/payment-stock && npm run build 2>&1 | tail -25"
```

Read the **last 25 lines**. Look for:

- `✓ Compiled successfully` or the route table — good
- `Error:` / `CssSyntaxError:` / `Type error:` — bad, do **not** reload yet

Common build failures and fixes:

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot apply unknown utility class` in `globals.css` | Tailwind v4 `@apply` referencing custom class in same `@layer` | Inline the rules instead of `@apply`-ing your own class |
| `await cookies()` / `await params` errors | Forgot Next.js 16 async API | Add `await` to the call |
| `Module not found: '@/...'` | Wrong import path or missing file | Re-rsync the missing file |
| `JWT_SECRET is required` at build | `.env` missing on VM | `scp .env` separately, never via rsync without explicit list |

### 3. Reload PM2

Only after a clean build:

```bash
sshpass -p 'tabezazaza123' ssh payment@100.103.216.30 \
  "pm2 reload payment-stock 2>&1 | tail -3"
```

Expected output:

```
[PM2] Applying action reloadProcessId on app [payment-stock](ids: [ 0 ])
[PM2] [payment-stock](0) ✓
```

If you see `errored` instead of `online`, run:

```bash
sshpass -p 'tabezazaza123' ssh payment@100.103.216.30 'pm2 logs payment-stock --lines 50 --nostream'
```

## One-Liner (combined)

For typical small changes, chain everything:

```bash
sshpass -p 'tabezazaza123' rsync -avz --relative <files> payment@100.103.216.30:/home/payment/payment-stock/ \
  && sshpass -p 'tabezazaza123' ssh payment@100.103.216.30 \
  "cd /home/payment/payment-stock && npm run build 2>&1 | tail -25 && pm2 reload payment-stock 2>&1 | tail -3"
```

The `&&` chain stops if rsync fails, but **does not** stop if build fails — always read the output.

## What NOT to Deploy

These are gitignored locally but not always on the VM. Don't blanket-rsync the workspace.

- `.env` (different per environment — VM has its own)
- `node_modules/`
- `.next/` (built on VM)
- `storage/` (user uploads — VM is the source of truth)
- `prisma/dev.db` if any

## Schema Migrations

Prisma migrations are not auto-run on `pm2 reload`. After changing [schema.prisma](../../../../prisma/schema.prisma):

```bash
sshpass -p 'tabezazaza123' ssh payment@100.103.216.30 \
  "cd /home/payment/payment-stock && npx prisma migrate deploy && npm run build && pm2 reload payment-stock"
```

Always run `migrate deploy` (not `migrate dev`) on the VM.

## Rollback

If something is wrong in production:

```bash
sshpass -p 'tabezazaza123' ssh payment@100.103.216.30 \
  "cd /home/payment/payment-stock && git log --oneline -5"
# Pick the last good commit
sshpass -p 'tabezazaza123' ssh payment@100.103.216.30 \
  "cd /home/payment/payment-stock && git checkout <sha> -- <files> && npm run build && pm2 reload payment-stock"
```

Or rsync back from the local working tree if `git` doesn't have what you need.
