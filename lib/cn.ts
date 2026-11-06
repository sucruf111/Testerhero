import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    // eigene Theme-Werte aus globals.css, damit Konflikte korrekt aufgelöst werden
    theme: {
      color: ["cream", "sand", "line", "ink", "ink-soft", "muted", "coral", "sun", "lilac"],
      shadow: ["soft", "lift", "glow"],
    },
  },
});

/** Führt CSS-Klassen zusammen; spätere Tailwind-Klassen überschreiben frühere. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(" "));
}
