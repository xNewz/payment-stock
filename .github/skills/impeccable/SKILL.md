---
name: impeccable
description: 'Impeccable end-to-end change workflow for the Payment-gateway project — investigate → plan → surgical edit → validate → build → deploy via rsync+pm2. Use when the user requests changes that must be deployed to the production VM, when fixing bugs that need to ship, when adding features to /admin /payment /login, when restyling UI, or when the user uses the phrase "100%" / "ไร้ที่ติ" / "ทั้งหมด" indicating they want a complete, no-gaps solution. Encodes deployment credentials, theme system, defense-in-depth patterns, and Thai response style learned across this codebase.'
argument-hint: '<short description of the change to make>'
---

# Impeccable — Payment-gateway Change Workflow

End-to-end recipe for shipping a change to this codebase **without breakage and without over-engineering**. This is the workflow we use whenever a request must land in production.

## When to Use

- The user asks for a code change that should reach the live VM
- A bug fix that requires verifying via build + reload
- UI restyle / theme work that touches multiple files
- Cross-cutting refactors (auth, layout, schema)
- Any request phrased "100%", "ทั้งหมด", "ไร้ที่ติ", "เอาขึ้น"

## When NOT to Use

- Read-only questions or codebase exploration → answer directly
- Single-line typo fixes → just edit + ship
- Documentation-only requests → no deploy needed
- The user explicitly says "อย่าเพิ่งdeploy" / "ดูก่อน"

## The Six Phases

### 1. Investigate (read before write)

- `read_file` the actual files that will change — never trust summary
- `grep_search` for symbol usages before renaming
- For unknowns, dispatch `Explore` subagent (read-only) instead of cluttering main context
- Confirm Next.js / Prisma version conventions in [AGENTS.md](../../../AGENTS.md) — this project uses **Next.js 16.x with breaking changes** (e.g. `await cookies()`, `await params`)

### 2. Plan

- For >2-step work, call `manage_todo_list` once with the full plan
- Mark exactly **one** task `in-progress` at a time
- Mark `completed` immediately when done — never batch
- Skip todos for trivial single-step changes

### 3. Implement (surgical, not sweeping)

- Prefer `multi_replace_string_in_file` over multiple sequential edits
- Run independent searches/reads in parallel
- **Don't** add features, comments, or refactors not asked for
- **Do** add 1-line WHY comments where the choice is non-obvious (cookie behaviour, sandbox limits, perf trade-offs)
- Reuse existing utilities — check `lib/` and [globals.css](../../../app/globals.css) `@layer components` before writing new helpers
- Theme additions go in [globals.css](../../../app/globals.css) under `@layer components` so every page benefits at once

### 4. Validate

- Run `get_errors` on every file you touched
- Don't skip this even when "it should be fine"
- If a file has TS/lint errors, fix before moving on

### 5. Deploy (this project's way)

The VM and credentials are fixed. See [deploy.md](./references/deploy.md) for the full reference. Quick form:

```bash
# Sync only changed files (preserve relative paths with --relative)
sshpass -p 'tabezazaza123' rsync -avz --relative \
  <file1> <file2> ... \
  payment@100.103.216.30:/home/payment/payment-stock/

# Build MUST succeed before reload — never reload a broken build
sshpass -p 'tabezazaza123' ssh payment@100.103.216.30 \
  "cd /home/payment/payment-stock && npm run build 2>&1 | tail -25 \
   && pm2 reload payment-stock 2>&1 | tail -3"
```

If the build fails: read the error, fix, re-rsync the fix, re-run build. Do **not** attempt to push around the failure with `--force` or skip flags.

### 6. Report (Thai, structured, scannable)

- Open with one-line status (✅ / ⚠️ / ❌)
- Use markdown tables for "what changed" lists
- Convert every file reference to a markdown link: `[path/file.js](path/file.js)` — never bare backticks for filenames
- End with what user should test or what to do next
- No emoji unless the response is itself a status banner
- Mix Thai prose with English technical terms — that's the user's preferred style

See [response-style.md](./references/response-style.md) for full templates.

## Defense-in-Depth Pattern

When the user asks for "100%" reliability on a hard problem, **never rely on a single mechanism**. Stack independent layers:

| Problem | Layer 1 | Layer 2 |
|---|---|---|
| LINE webview cookie loss | `intent://` + `?openExternalBrowser=1` to escape | JWT in localStorage + Bearer header fallback |
| Upload reliability | Client-side image compression | XHR with progress + retry-friendly errors |
| Auth | httpOnly cookie | `Authorization: Bearer` from `verifyAuth()` |

Each layer is independent — if layer 1 fails, layer 2 still works.

## Project Cheat-Sheet

- **VM**: `payment@100.103.216.30` (password `tabezazaza123`)
- **Path**: `/home/payment/payment-stock/`
- **Process manager**: PM2, app name `payment-stock`
- **Tunnel**: Cloudflare → port 8080
- **Stack**: Next.js 16.2.7, React 19.2.4, Prisma 6.19.3 + MySQL, Tailwind v4, JWT + bcryptjs
- **Theme**: Aurora Gold Premium — utilities live in [globals.css](../../../app/globals.css) (`.glass-card`, `.brand-line`, `.btn-premium`, `.text-gold`, `.pill-{amber,emerald,rose,sky}`, `.surface-highlight`, `.glass-strong`)
- **Auth**: [lib/auth.js](../../../lib/auth.js) (server) + [lib/authClient.js](../../../lib/authClient.js) (client `authFetch`)
- **Tax rule**: 140,000 THB / month / bank account (`TAX_LIMIT_PER_MONTH` in [admin/page.js](../../../app/admin/page.js))

## Anti-Patterns to Avoid

- **Reloading PM2 on a failed build** — the app crashes silently. Always check the build output's last lines first.
- **Hard-coding the same gradient/border combo in 5 files** — promote to `@layer components` in [globals.css](../../../app/globals.css).
- **Single-mechanism solutions for "100%" requests** — always layer.
- **Auto-pushing to git** without explicit user request, even when "it would make sense".
- **Using Tailwind v4 `@apply` with classes defined later in the same `@layer components`** — they don't resolve. Inline the styles instead.
- **`Cache-Control: public` on private uploads** — must be `private`.
- **`force-dynamic` on every API route** — only where genuinely needed (e.g. `/api/auth/me`).

## Slash Command

This skill is invoked as `/impeccable <description>`. The description is just a hint — the workflow is the same. Example:

```
/impeccable เพิ่มหน้า audit log สำหรับ admin
```
