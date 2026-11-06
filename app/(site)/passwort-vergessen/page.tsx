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
      subtitle="Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link für ein neues Passwort."
      footer={
        <Link href="/anmelden" className="font-semibold text-coral-600 hover:text-coral-700">
          Zurück zum Einloggen
        </Link>
      }
    >
      {state.ok ? (
        <div className="flex gap-3">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <p className="text-ink-soft">{state.message}</p>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <Field label="E-Mail-Adresse" name="email" error={state.fieldErrors?.email}>
            <Input name="email" type="email" autoComplete="email" required error={state.fieldErrors?.email} />
          </Field>
          <SubmitButton size="lg" className="w-full" pendingText="Einen Moment …">
            Link schicken
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
