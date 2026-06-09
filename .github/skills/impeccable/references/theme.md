# Theme System Reference

The "Aurora Gold Premium" design language. All utilities live in [globals.css](../../../../app/globals.css) so every page changes at once when the theme evolves.

## When to Apply

Whenever you create or modify a card, button, header, modal, or status indicator, **first** check whether one of these utilities already does it.

## Layer Anatomy

```
<body>
  <AuroraBackground />          ← fixed orbs, behind everything (-z-10)
  <ThemeProvider>
    <WebviewDetector />         ← in-app browser interstitial
    {page content}              ← uses .glass-* utilities
  </ThemeProvider>
</body>
```

## Utility Classes

### Surfaces

| Class | Purpose | Where used |
|---|---|---|
| `.glass-card` | Standard card — `bg-card/70 backdrop-blur-xl border border-border/60 shadow-xl` | All `<Card>` instances on /admin and /payment |
| `.glass-strong` | Header/nav surface — heavier backdrop blur | Top navigation bars |
| `.surface-highlight` | Inset top highlight — gives "lit from above" feel | Pair with `.glass-card` |

### Brand Accents

| Class | Purpose |
|---|---|
| `.brand-line` | 2px gold gradient bar — top of every header and modal |
| `.text-gold` | Gold gradient text — for emphasis and loading states |

### Buttons

| Class | Use For |
|---|---|
| `.btn-premium` | Primary CTAs — gold gradient + animated sheen on hover |
| (default Button variants) | Secondary / ghost actions |

`.btn-premium` includes a `::after` pseudo-element that sweeps a light gradient across on hover. Don't override the background — pair it with `h-11 rounded-xl` for the right proportions.

### Status Pills

Replaces the old `<Badge variant="outline" className="text-yellow-600...">` pattern.

| Class | State |
|---|---|
| `.pill-amber` | Pending / warning |
| `.pill-emerald` | Approved / success |
| `.pill-rose` | Rejected / error |
| `.pill-sky` | Info / neutral |

Use as `<span className="pill-amber">รอดำเนินการ</span>`.

## Color Tokens

Defined in `:root` and `.dark` selectors:

- `--primary: oklch(0.78 0.16 80)` — the signature gold (dark mode)
- `--brand: oklch(0.78 0.16 80)` — alias for primary
- `--accent: oklch(0.235 0.01 240)` — cool dark surface (dark mode)

When picking accent colors for new components, prefer named tailwind palette (`amber-500`, `emerald-500`, `rose-500`) over arbitrary `oklch()` so the tone stays in the family.

## Animation

`@keyframes aurora` drifts the orbs slowly (22-35s cycles). It's already wired up. The whole stylesheet honours `prefers-reduced-motion: reduce` — don't add `animate-*` to anything critical that breaks if motion is off.

## Common Pitfalls

### Tailwind v4 + `@apply`

You can't `@apply` a class defined later in the same `@layer components`. This will fail at build:

```css
/* BAD — Tailwind can't resolve .pill */
.pill { @apply inline-flex ...; }
.pill-amber { @apply pill border-amber-500/30 ...; }
```

Inline the shared rules instead:

```css
.pill-amber {
  @apply inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold border-amber-500/30 bg-amber-500/10 text-amber-500;
}
```

### Don't Re-render the Aurora Locally

[AuroraBackground](../../../../components/aurora-background.js) is mounted once in [layout.js](../../../../app/layout.js). If you copy its orb divs onto a specific page, you double the GPU load. Login page used to do this — it now relies on the global one.

### Wrong Spinner Colors

Loading states must use gold (`border-amber-400`) or `.text-gold`. Old code had `from-indigo-400 to-purple-400` — that's pre-theme and should be migrated whenever spotted.

## Adding New Components

1. Check if a `.glass-*` / `.btn-*` / `.pill-*` utility already covers it
2. If you need a new shared style, add it to [globals.css](../../../../app/globals.css) under `@layer components`
3. Document it here when you do
4. Don't reach for component libraries for one-off needs — the existing primitives + Tailwind cover almost everything
