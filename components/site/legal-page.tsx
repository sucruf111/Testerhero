import type { ReactNode } from "react";
import { Alert } from "@/components/ui/form";

export function LegalPage({ title, children, draft = true }: { title: string; children: ReactNode; draft?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      {draft && (
        <Alert tone="info" className="mt-4">
          Entwurf: Bitte vor dem Start mit den Daten der Agentur ergänzen und rechtlich prüfen lassen.
        </Alert>
      )}
      <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-ink-soft [&_h2]:mb-1.5 [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-2 [&_ul]:mt-2 [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  );
}
