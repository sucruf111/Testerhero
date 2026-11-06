"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/lib/actions/auth";
import { AddressFields } from "@/components/site/address-fields";
import { Alert, Checkbox, Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(registerAction, {});
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-Mail-Adresse" name="email" error={e.email}>
          <Input name="email" type="email" autoComplete="email" required defaultValue={(v.email as string) ?? ""} error={e.email} />
        </Field>
        <Field label="Passwort" name="password" hint="Mindestens 8 Zeichen" error={e.password}>
          <Input name="password" type="password" autoComplete="new-password" required minLength={8} error={e.password} />
        </Field>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold">Lieferadresse</p>
        <AddressFields values={v} errors={e} />
      </div>

      <div>
        <Checkbox
          name="consent"
          defaultChecked={v.consent === "on"}
          label={
            <>
              Ich habe die{" "}
              <Link href="/teilnahmebedingungen" target="_blank" className="font-semibold text-coral-600 hover:underline">
                Teilnahmebedingungen
              </Link>{" "}
              und die{" "}
              <Link href="/datenschutz" target="_blank" className="font-semibold text-coral-600 hover:underline">
                Datenschutzerklärung
              </Link>{" "}
              gelesen und bin einverstanden.
            </>
          }
        />
        {e.consent && <p className="mt-1.5 text-[13px] text-red-600">{e.consent[0]}</p>}
      </div>

      <div className="space-y-3 rounded-xl bg-sand/60 p-4">
        <div>
          <Checkbox name="adult" defaultChecked={v.adult === "on"} label="Ich bin mindestens 18 Jahre alt." />
          {e.adult && <p className="mt-1.5 text-[13px] text-red-600">{e.adult[0]}</p>}
        </div>
        <Checkbox
          name="adultOptIn"
          defaultChecked={v.adultOptIn === "on"}
          label="Ich möchte auch Erotikprodukte bekommen (freiwillig)."
          description="Zum Beispiel Gleitgel oder Massageöl. Ohne Haken bekommst du nie so ein Paket. Du kannst das jederzeit in deinem Konto ändern."
        />
      </div>

      <SubmitButton size="lg" className="w-full" pendingText="Einen Moment …">
        Konto anlegen
      </SubmitButton>
    </form>
  );
}
