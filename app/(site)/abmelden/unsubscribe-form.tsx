"use client";

import { useActionState } from "react";
import { CircleCheck } from "lucide-react";
import { unsubscribeAction } from "@/lib/actions/tester";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

export function UnsubscribeForm({ token }: { token: string | null }) {
  const [state, action] = useActionState<FormState, FormData>(unsubscribeAction, {});

  if (state.ok) {
    return (
      <div>
        <div className="flex gap-3">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <p className="text-ink-soft">{state.message}</p>
        </div>
        <p className="mt-3 text-sm text-muted">
          Du kannst jederzeit wieder mitmachen. Log dich dazu einfach ein. Dein Konto ganz löschen kannst du im Profil.
        </p>
        <LinkButton href="/" variant="secondary" className="mt-5">
          Zur Startseite
        </LinkButton>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {token && <input type="hidden" name="token" value={token} />}
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <p className="text-sm text-ink-soft">
        Nach der Abmeldung bekommst du keine Pakete und keine E-Mails mehr. Ein Paket, das noch nicht verschickt wurde, geht an
        jemand anderen. Dein Konto bleibt erhalten, falls du später wieder mitmachen willst.
      </p>
      <SubmitButton size="lg" className="w-full" pendingText="Einen Moment …">
        Ja, abmelden
      </SubmitButton>
    </form>
  );
}
