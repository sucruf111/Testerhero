"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { registerAction } from "@/lib/actions/auth";
import { AddressFields, InterestFields } from "@/components/site/address-fields";
import { Alert, Checkbox, Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(registerAction, {});
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-10" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Section step={1} title="Deine Zugangsdaten">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="E-Mail-Adresse" name="email" error={e.email}>
            <Input name="email" type="email" autoComplete="email" required defaultValue={(v.email as string) ?? ""} error={e.email} placeholder="du@beispiel.de" />
          </Field>
          <Field label="Passwort" name="password" hint="Mindestens 8 Zeichen." error={e.password}>
            <Input name="password" type="password" autoComplete="new-password" required minLength={8} error={e.password} />
          </Field>
        </div>
      </Section>

      <Section step={2} title="Lieferadresse" text="Hierhin schicken wir deine Testprodukte.">
        <AddressFields values={v} errors={e} />
      </Section>

      <Section step={3} title="Deine Interessen">
        <InterestFields selected={(v.interests as string[]) ?? []} />
      </Section>

      <div className="space-y-4 rounded-2xl bg-cream p-5 ring-1 ring-line/70">
        <Checkbox
          name="notifyNewProducts"
          defaultChecked={v.notifyNewProducts === undefined ? true : v.notifyNewProducts === "on"}
          label="Informiert mich per E-Mail über neue Produkttests."
          description="Du kannst dich jederzeit mit einem Klick wieder abmelden."
        />
        <Checkbox
          name="consent"
          defaultChecked={v.consent === "on"}
          label={
            <>
              Ich akzeptiere die{" "}
              <Link href="/teilnahmebedingungen" target="_blank" className="font-semibold text-coral-600 underline-offset-2 hover:underline">
                Teilnahmebedingungen
              </Link>{" "}
              und habe die{" "}
              <Link href="/datenschutz" target="_blank" className="font-semibold text-coral-600 underline-offset-2 hover:underline">
                Datenschutzerklärung
              </Link>{" "}
              gelesen.
            </>
          }
        />
        {e.consent && <p className="text-sm text-red-600">{e.consent[0]}</p>}
      </div>

      <SubmitButton size="lg" className="w-full" pendingText="Konto wird erstellt …">
        Kostenlos registrieren <ArrowRight />
      </SubmitButton>
    </form>
  );
}

function Section({ step, title, text, children }: { step: number; title: string; text?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-full bg-coral-500 text-sm font-bold text-white">{step}</span>
        <div>
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          {text && <p className="text-sm text-muted">{text}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
