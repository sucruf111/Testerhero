"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/lib/actions/auth";
import { Alert, Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

export function AdminLoginForm() {
  const [state, action] = useActionState<FormState, FormData>(adminLoginAction, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="E-Mail" name="email">
        <Input name="email" type="email" autoComplete="username" required defaultValue={(state.values?.email as string) ?? ""} />
      </Field>
      <Field label="Passwort" name="password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton variant="dark" className="w-full" pendingText="Anmelden …">
        Anmelden
      </SubmitButton>
    </form>
  );
}
