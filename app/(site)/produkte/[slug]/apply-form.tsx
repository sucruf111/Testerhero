"use client";

import { useActionState } from "react";
import { PartyPopper, Send } from "lucide-react";
import { applyAction } from "@/lib/actions/tester";
import { LinkButton } from "@/components/ui/button";
import { Alert, Field, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

export function ApplyForm({ productId, full }: { productId: string; full: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(applyAction, {});

  if (state.ok) {
    return (
      <div className="text-center sm:text-left">
        <span className="inline-grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <PartyPopper className="size-6" />
        </span>
        <h2 className="mt-3 font-display text-xl font-semibold">Bewerbung abgeschickt!</h2>
        <p className="mt-1.5 text-[15px] text-muted">{state.message}</p>
        <LinkButton href="/konto" variant="secondary" className="mt-5">
          Zu meinen Tests
        </LinkButton>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <div>
        <h2 className="font-display text-xl font-semibold">Jetzt für diesen Test bewerben</h2>
        {full && (
          <p className="mt-1.5 text-sm text-muted">
            Alle Plätze sind aktuell vergeben – du kannst dich trotzdem für die Warteliste bewerben.
          </p>
        )}
      </div>
      <Field
        label="Warum möchtest du dieses Produkt testen?"
        name="motivation"
        optional
        hint="Ein, zwei Sätze erhöhen deine Chancen – z. B. wie du das Produkt nutzen würdest."
        error={state.fieldErrors?.motivation}
      >
        <Textarea name="motivation" rows={3} maxLength={1000} placeholder="Ich koche jeden Tag für meine Familie und …" />
      </Field>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <SubmitButton size="lg" className="w-full" pendingText="Wird gesendet …">
        <Send /> Bewerbung absenden
      </SubmitButton>
      <p className="text-center text-xs text-muted">Kostenlos und unverbindlich. Du kannst deine Bewerbung jederzeit zurückziehen.</p>
    </form>
  );
}
