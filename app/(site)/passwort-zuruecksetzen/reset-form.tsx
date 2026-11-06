"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/actions/auth";
import { Alert, Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetPasswordAction, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Neues Passwort" name="password" error={state.fieldErrors?.password}>
        <Input name="password" type="password" autoComplete="new-password" minLength={8} required error={state.fieldErrors?.password} />
      </Field>
      <Field label="Passwort wiederholen" name="passwordConfirm" error={state.fieldErrors?.passwordConfirm}>
        <Input name="passwordConfirm" type="password" autoComplete="new-password" minLength={8} required error={state.fieldErrors?.passwordConfirm} />
      </Field>
      <SubmitButton size="lg" className="w-full" pendingText="Wird gespeichert …">
        Passwort speichern
      </SubmitButton>
    </form>
  );
}
