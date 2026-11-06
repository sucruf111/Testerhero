import { Check } from "lucide-react";
import type { ApplicationStatus } from "@/lib/db/schema";
import { cn } from "@/lib/cn";

const steps = [
  { key: "pending", label: "Beworben" },
  { key: "accepted", label: "Ausgewählt" },
  { key: "shipped", label: "Versendet" },
  { key: "received", label: "Erhalten" },
  { key: "reviewed", label: "Bewertet" },
] as const;

export function StatusSteps({ status }: { status: ApplicationStatus }) {
  if (status === "rejected" || status === "withdrawn") return null;
  const current = steps.findIndex((s) => s.key === status);
  return (
    <ol className="flex items-center" aria-label="Fortschritt">
      {steps.map((step, i) => {
        const done = i < current || status === "reviewed";
        const active = i === current && status !== "reviewed";
        return (
          <li key={step.key} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full text-[11px] font-bold ring-2 transition",
                  done && "bg-coral-500 text-white ring-coral-500",
                  active && "bg-white text-coral-600 ring-coral-500",
                  !done && !active && "bg-white text-muted/60 ring-line",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn("text-[11px] font-semibold whitespace-nowrap", done || active ? "text-ink" : "text-muted/70")}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={cn("mx-1 mb-5 h-0.5 flex-1 rounded-full", i < current || status === "reviewed" ? "bg-coral-400" : "bg-line")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
