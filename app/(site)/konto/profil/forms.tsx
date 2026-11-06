"use client";

import { useActionState, useState } from "react";
import {
  changePasswordAction,
  deleteAccountAction,
  unsubscribeAction,
  updateAdultPreferenceAction,
  updateProfileAction,
} from "@/lib/actions/tester";
import { AddressFields } from "@/components/site/address-fields";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

type Values = Record<string, string | number | null>;

export function ProfileForm({ values }: { values: Values }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfileAction, {});
  const v = { ...values, ...(state.values ?? {}) } as Record<string, string>;
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <Field label="E-Mail-Adresse" name="email" error={e.email}>
        <Input name="email" type="email" autoComplete="email" required defaultValue={v.email} error={e.email} />
      </Field>
      <AddressFields values={v} errors={e} />
      <SubmitButton pendingText="Einen Moment …">Speichern</SubmitButton>
    </form>
  );
}

export function AdultPreferenceForm({ optIn, ageConfirmed }: { optIn: boolean; ageConfirmed: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(updateAdultPreferenceAction, {});
  const e = state.fieldErrors ?? {};
  const checked = state.values?.adultOptIn === "on" || (!state.values && optIn);

  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <Checkbox
        name="adultOptIn"
        defaultChecked={checked}
        label="Ich möchte auch Erotikprodukte bekommen."
        description="Zum Beispiel Gleitgel oder Massageöl. Ohne Haken bekommst du nie so ein Paket."
      />
      {!ageConfirmed && (
        <div>
          <Checkbox name="adult" label="Ich bin mindestens 18 Jahre alt." />
          {e.adult && <p className="mt-1.5 text-[13px] text-red-600">{e.adult[0]}</p>}
        </div>
      )}
      <SubmitButton variant="secondary" pendingText="Einen Moment …">
        Speichern
      </SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePasswordAction, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Aktuelles Passwort" name="currentPassword" error={e.currentPassword}>
          <Input name="currentPassword" type="password" autoComplete="current-password" required error={e.currentPassword} />
        </Field>
        <Field label="Neues Passwort" name="newPassword" hint="Mindestens 8 Zeichen" error={e.newPassword}>
          <Input name="newPassword" type="password" autoComplete="new-password" minLength={8} required error={e.newPassword} />
        </Field>
      </div>
      <SubmitButton variant="secondary" pendingText="Einen Moment …">
        Passwort ändern
      </SubmitButton>
    </form>
  );
}

export function UnsubscribeBox() {
  const [state, action] = useActionState<FormState, FormData>(unsubscribeAction, {});
  return (
    <div>
      <h2 className="font-semibold">Pause machen</h2>
      {state.ok ? (
        <p className="mt-2 text-sm text-emerald-700">{state.message}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">Du bekommst dann keine Pakete und keine E-Mails mehr. Dein Konto bleibt.</p>
          {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
          <form action={action} className="mt-3">
            <SubmitButton variant="secondary" size="sm" confirm="Willst du dich wirklich abmelden? Ein noch nicht verschicktes Paket geht dann an jemand anderen.">
              Abmelden
            </SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}

export function DeleteAccountForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(deleteAccountAction, {});
  return (
    <div>
      <h2 className="font-semibold text-red-700">Konto löschen</h2>
      <p className="mt-1 text-sm text-muted">Löscht dein Konto und alle deine Daten. Das kann man nicht rückgängig machen.</p>
      {!open ? (
        <Button variant="ghost" size="sm" className="mt-2 -ml-3 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setOpen(true)}>
          Konto löschen …
        </Button>
      ) : (
        <form action={action} className="mt-3 space-y-3">
          <Field label="Dein Passwort zur Sicherheit" name="deletePassword" error={state.fieldErrors?.password}>
            <Input id="deletePassword" name="password" type="password" autoComplete="current-password" required error={state.fieldErrors?.password} />
          </Field>
          <SubmitButton variant="danger" size="sm" className="w-full" confirm="Konto und alle Daten endgültig löschen?">
            Endgültig löschen
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
