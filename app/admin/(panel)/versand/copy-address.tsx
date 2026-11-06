"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyAddress({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* Zwischenablage nicht verfügbar */
        }
      }}
      className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-coral-600 hover:text-coral-700"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Kopiert" : "Adresse kopieren"}
    </button>
  );
}
