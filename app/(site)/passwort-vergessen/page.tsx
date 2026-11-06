"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordResetAction, {});
  return (
    <AuthShell
      title="Passwort vergessen?"
      subtitle="Kein Problem. Wir schicken dir einen Link, mit dem du ein neues Passwort festlegen kannst."
      footer={
        <Link href="/anmelden" className="font-semibold text-coral-600 hover:text-coral-700">
          Zurück zur Anmeldung
        </Link>
      }
    >
      {state.ok ? (
        <div className="text-center">
          <span className="inline-grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <MailCheck className="size-7" />
          </span>
          <p className="mt-4 text-ink-soft">{state.message}</p>
        </div>
      ) : (
        <form action={action} className="space-y-5">
          <Field label="E-Mail-Adresse" name="email" error={state.fieldErrors?.email}>
            <Input name="email" type="email" autoComplete="email" required error={state.fieldErrors?.email} placeholder="du@beispiel.de" />
          </Field>
          <SubmitButton size="lg" className="w-full" pendingText="Wird gesendet …">
            Link anfordern
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
