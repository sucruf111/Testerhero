"use client";

import { useActionState } from "react";
import { BellOff, CircleCheckBig, DoorOpen } from "lucide-react";
import { unsubscribeAction } from "@/lib/actions/tester";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

export function UnsubscribeForm({ token, notify }: { token: string | null; notify: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(unsubscribeAction, {});

  if (state.ok) {
    return (
      <div className="text-center">
        <span className="inline-grid size-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600">
          <CircleCheckBig className="size-8" />
        </span>
        <p className="mt-5 text-lg text-ink-soft">{state.message}</p>
        <p className="mt-3 text-sm text-muted">Du kannst dein Konto jederzeit wieder aktivieren oder in deinem Profil vollständig löschen.</p>
        <LinkButton href="/" variant="secondary" className="mt-7">
          Zur Startseite
        </LinkButton>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      {token && <input type="hidden" name="token" value={token} />}
      {state.error && <Alert tone="error">{state.error}</Alert>}

      {notify && (
        <OptionButton
          mode="emails"
          icon={<BellOff />}
          title="Nur keine E-Mails zu neuen Produkten"
          text="Du bleibst Tester:in und kannst dich weiterhin selbst auf der Seite bewerben."
        />
      )}
      <OptionButton
        mode="all"
        icon={<DoorOpen />}
        title="Komplett abmelden"
        text="Du erhältst keine Produkte und keine E-Mails mehr. Offene Bewerbungen werden zurückgezogen."
      />
    </form>
  );
}

function OptionButton({ mode, icon, title, text }: { mode: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <SubmitButton
      name="mode"
      value={mode}
      variant="secondary"
      className="h-auto w-full justify-start gap-4 rounded-2xl px-5 py-4 text-left whitespace-normal [&_svg]:size-5"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral-50 text-coral-600">{icon}</span>
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-sm font-normal text-muted">{text}</span>
      </span>
    </SubmitButton>
  );
}
