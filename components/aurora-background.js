'use client';

/**
 * AuroraBackground — fixed-position warm gradient orbs rendered behind every page.
 *
 * Tuned for "Minimal Light" — orbs are barely there in light mode (just enough
 * warmth to avoid a flat white wall) and richer in dark mode. Pointer events
 * disabled so it never interferes with interaction.
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Base color wash so dark mode never shows pure black */}
      <div className="absolute inset-0 bg-background" />

      {/* Orb 1 — large warm cream, top-left */}
      <div className="absolute -top-[25%] -left-[15%] h-[75vh] w-[75vw] rounded-full bg-[radial-gradient(ellipse_at_center,oklch(0.85_0.09_75)_0%,transparent_60%)] opacity-[0.22] dark:opacity-[0.18] blur-3xl motion-safe:animate-[aurora_22s_ease-in-out_infinite_alternate]" />

      {/* Orb 2 — soft peach, bottom-right */}
      <div className="absolute bottom-[-20%] -right-[10%] h-[65vh] w-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,oklch(0.88_0.08_55)_0%,transparent_60%)] opacity-[0.16] dark:opacity-[0.14] blur-3xl motion-safe:animate-[aurora_28s_ease-in-out_infinite_alternate-reverse]" />

      {/* Orb 3 — pale amber, center-right */}
      <div className="absolute top-[35%] left-[55%] h-[40vh] w-[40vw] rounded-full bg-[radial-gradient(ellipse_at_center,oklch(0.92_0.06_85)_0%,transparent_65%)] opacity-[0.14] dark:opacity-[0.10] blur-3xl motion-safe:animate-[aurora_35s_ease-in-out_infinite_alternate]" />

      {/* Subtle grain — adds depth, prevents banding in gradients */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.018] mix-blend-multiply dark:mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}
