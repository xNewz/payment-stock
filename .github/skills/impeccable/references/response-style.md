# Response Style Reference

The user's communication preferences observed across this project.

## Language

- **Thai prose** + English technical terms (no translation of `cookie`, `Bearer`, `localStorage`, etc.)
- Direct and dense — no filler ("Let me first...", "I will now...", "Here's the result:")
- Skip greetings, skip recap of what they just asked
- It's fine to use English-only headings if they read more cleanly

## Structure

Open with **one** of:

- `Deploy เสร็จเรียบร้อย ✅` — when work shipped successfully
- `Build ผ่าน ✓` — when a step inside the workflow succeeded
- `⚠️ ติดอยู่ที่ ...` — when blocked
- `❌ Build fail ที่ ...` — when something broke

Then a short structured body, in this order when applicable:

1. **What changed** — markdown table or bullet list
2. **How it works** — brief mechanism / flow diagram (use code fences with arrows for flows)
3. **Files** — markdown links to every file touched
4. **What to test** — actionable next step

## File References

**Always** convert filenames to markdown links with workspace-relative paths.

- ✅ `[lib/auth.js](lib/auth.js)`
- ✅ `[app/login/page.js](app/login/page.js#L72)` (when citing a line)
- ❌ `` `lib/auth.js` `` — never inline-code filenames
- ❌ `lib/auth.js` — never bare paths

## Code Snippets

- Use fenced code blocks with the language tag (` ```bash `, ` ```js `, ` ```diff `)
- Show **only** the changed parts, not the full file
- For sed/rsync commands, show the actual command you ran so the user can re-run

## Tables

Used heavily for:

- Bug → fix mapping (`Bug | Old | New`)
- File → change mapping (`File | Change`)
- OS-specific behaviour (`OS | Method | Reliability`)

Keep columns to ≤4. Long values go in the body, not in the table.

## Flow Diagrams

For UX flows (e.g. login → restore → redirect), prefer ASCII arrow blocks over Mermaid:

```
ครั้งแรก: เปิดลิงก์ใน LINE
  → WebviewDetector แสดง interstitial + auto-attempt escape
  → user เปิดใน Safari/Chrome → login → token เก็บทั้ง cookie + localStorage
```

Renders correctly everywhere, no extension needed.

## What Not To Include

- Time estimates ("this should take 5 minutes")
- "I hope this helps" / "Let me know"
- Restating the request back at the user
- Apologies for tool limits or context size
- Markdown summary docs (`SUMMARY.md`, `CHANGES.md`) unless explicitly asked

## What The User Wants in The Last Section

- One actionable suggestion: "ลองทดสอบใน LINE ได้เลย"
- Realistic caveats: "iOS LINE บาง version อาจยังต้องกดเอง — เป็นข้อจำกัดของ Apple sandbox"
- An invitation to follow up if they hit problems with **specific signals** to send: "บอกรุ่น/iOS version จะดูเพิ่ม"

## Status Emoji Vocabulary

Use sparingly, only as visual markers — not decoration:

| Emoji | Meaning |
|---|---|
| ✅ | Done, working, deployed |
| ⚠️ | Caveat, partial, needs attention |
| ❌ | Failed, broken |
| 🎯 | Result / outcome highlight |
| 🛡️ | Security-related note |
| 📋 | Steps / checklist |

Don't use 🚀 / 🎉 / 🔥 / 💪 — too casual for this user.
