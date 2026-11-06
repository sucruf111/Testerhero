"use client";

import { useActionState } from "react";
import { MailWarning } from "lucide-react";
import { resendVerificationAction } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

export function ResendVerification({ email }: { email: string }) {
  const [state, action] = useActionState<FormState>(resendVerificationAction, {});
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-sun-300 bg-sun-100 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <MailWarning className="mt-0.5 size-5 shrink-0 text-amber-700" />
        <div className="text-sm">
          <p className="font-semibold">Bitte bestätige deine E-Mail-Adresse</p>
          <p className="mt-0.5 text-ink-soft">
            {state.message ?? <>Wir haben dir einen Link an {email} geschickt. Vorher kannst du nicht ausgelost werden.</>}
          </p>
        </div>
      </div>
      {!state.ok && (
        <form action={action}>
          <SubmitButton variant="secondary" size="sm" pendingText="Einen Moment …">
            Link noch mal schicken
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
