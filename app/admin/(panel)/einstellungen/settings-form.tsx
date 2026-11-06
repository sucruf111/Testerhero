"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "@/lib/actions/admin";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

export function SettingsForm({ values }: { values: Record<string, string> }) {
  const [state, action] = useActionState<FormState, FormData>(saveSettingsAction, {});
  const v = { ...values, ...((state.values as Record<string, string>) ?? {}) };
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5 rounded-xl border border-line bg-white p-5">
      <FormMessage state={state} />

      <fieldset>
        <legend className="text-sm font-semibold">Wie viele Pakete darf eine Person bekommen?</legend>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          Höchstens
          <Input name="maxClaimsPerWindow" type="number" min={1} max={100} defaultValue={v.maxClaimsPerWindow} error={e.maxClaimsPerWindow} className="w-20" aria-label="Anzahl Pakete" />
          Pakete in
          <Input name="claimWindowDays" type="number" min={1} max={365} defaultValue={v.claimWindowDays} error={e.claimWindowDays} className="w-20" aria-label="Anzahl Tage" />
          Tagen
        </div>
        {(e.maxClaimsPerWindow || e.claimWindowDays) && (
          <p className="mt-1 text-[13px] text-red-600">{(e.maxClaimsPerWindow ?? e.claimWindowDays)?.[0]}</p>
        )}
      </fieldset>

      <Field
        label="Wie viele Pakete dürfen gleichzeitig offen sein?"
        name="maxOpenTests"
        hint="Offen heißt: ausgelost, aber noch nicht bewertet. Wer das Limit erreicht hat, wird erst nach einer Bewertung wieder ausgelost."
        error={e.maxOpenTests}
      >
        <Input name="maxOpenTests" type="number" min={1} max={50} defaultValue={v.maxOpenTests} error={e.maxOpenTests} className="w-20" />
      </Field>

      <p className="rounded-lg bg-cream p-3 text-[13px] text-muted">
        Immer gilt: Niemand bekommt dasselbe Produkt zweimal, und pro Adresse geht jedes Produkt nur an eine Person.
      </p>

      <SubmitButton pendingText="Einen Moment …">Speichern</SubmitButton>
    </form>
  );
}
