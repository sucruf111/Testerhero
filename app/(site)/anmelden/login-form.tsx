"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Alert, Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="weiter" value={next} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="E-Mail-Adresse" name="email" error={state.fieldErrors?.email}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={(state.values?.email as string) ?? ""}
          error={state.fieldErrors?.email}
        />
      </Field>
      <Field
        label={
          <span className="flex w-full items-center justify-between">
            Passwort
            <Link href="/passwort-vergessen" className="font-medium text-coral-600 hover:text-coral-700">
              Passwort vergessen?
            </Link>
          </span>
        }
        name="password"
        error={state.fieldErrors?.password}
      >
        <Input name="password" type="password" autoComplete="current-password" required error={state.fieldErrors?.password} />
      </Field>
      <SubmitButton size="lg" className="w-full" pendingText="Einen Moment …">
        Einloggen
      </SubmitButton>
    </form>
  );
}
