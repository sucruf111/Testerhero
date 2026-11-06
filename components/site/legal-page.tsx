import type { ReactNode } from "react";
import { Alert } from "@/components/ui/form";

export function LegalPage({ title, children, draft = true }: { title: string; children: ReactNode; draft?: boolean }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-14 sm:px-6">
      <h1 className="font-display text-5xl font-semibold tracking-tight">{title}</h1>
      {draft && (
        <Alert tone="info" className="mt-6">
          Vorlage – bitte vor dem Livegang mit den Angaben der Agentur ergänzen und rechtlich prüfen lassen.
        </Alert>
      )}
      <div className="mt-10 space-y-8 text-[16px] leading-relaxed text-ink-soft [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  );
}
