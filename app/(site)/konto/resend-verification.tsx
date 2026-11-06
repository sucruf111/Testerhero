"use client";

import { useActionState } from "react";
import { MailWarning } from "lucide-react";
import { resendVerificationAction } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

export function ResendVerification({ email }: { email: string }) {
  const [state, action] = useActionState<FormState>(resendVerificationAction, {});
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-sun-100 p-5 ring-1 ring-sun-300/60 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex gap-3">
        <MailWarning className="mt-0.5 size-5 shrink-0 text-amber-700" />
        <div>
          <p className="font-semibold text-ink">Bitte bestätige deine E-Mail-Adresse</p>
          <p className="mt-1 text-[15px] text-ink-soft">
            {state.message ?? <>Wir haben einen Bestätigungslink an <strong>{email}</strong> geschickt. Erst danach kannst du dich bewerben.</>}
          </p>
        </div>
      </div>
      {!state.ok && (
        <form action={action}>
          <SubmitButton variant="secondary" size="sm" pendingText="Wird gesendet …">
            Link erneut senden
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
