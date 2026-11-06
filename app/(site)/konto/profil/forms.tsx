"use client";

import { useActionState, useState } from "react";
import { BellOff, Trash2 } from "lucide-react";
import {
  changePasswordAction,
  deleteAccountAction,
  unsubscribeAction,
  updateProfileAction,
} from "@/lib/actions/tester";
import { AddressFields, InterestFields } from "@/components/site/address-fields";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validation";

type Values = Record<string, string | number | null>;

export function ProfileForm({ values, interests, notify }: { values: Values; interests: string[]; notify: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfileAction, {});
  const v = { ...values, ...(state.values ?? {}) } as Record<string, string>;
  const e = state.fieldErrors ?? {};
  const selected = (state.values?.interests as string[] | undefined) ?? interests;

  return (
    <form action={action} className="space-y-8">
      <FormMessage state={state} />
      <Field label="E-Mail-Adresse" name="email" hint="Bei einer Änderung schicken wir dir einen neuen Bestätigungslink." error={e.email}>
        <Input name="email" type="email" autoComplete="email" required defaultValue={v.email} error={e.email} />
      </Field>
      <AddressFields values={v} errors={e} />
      <InterestFields selected={selected} />
      <Checkbox
        name="notifyNewProducts"
        defaultChecked={state.values ? state.values.notifyNewProducts === "on" : notify}
        label="Informiert mich per E-Mail über neue Produkttests."
      />
      <SubmitButton pendingText="Wird gespeichert …">Änderungen speichern</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePasswordAction, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Aktuelles Passwort" name="currentPassword" error={e.currentPassword}>
          <Input name="currentPassword" type="password" autoComplete="current-password" required error={e.currentPassword} />
        </Field>
        <Field label="Neues Passwort" name="newPassword" hint="Mindestens 8 Zeichen." error={e.newPassword}>
          <Input name="newPassword" type="password" autoComplete="new-password" minLength={8} required error={e.newPassword} />
        </Field>
      </div>
      <SubmitButton variant="secondary" pendingText="Wird gespeichert …">
        Passwort ändern
      </SubmitButton>
    </form>
  );
}

export function UnsubscribeBox({ notify }: { notify: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(unsubscribeAction, {});
  return (
    <div>
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <BellOff className="size-4.5 text-muted" /> Abmelden
      </h2>
      {state.ok ? (
        <p className="mt-3 text-sm text-emerald-700">{state.message}</p>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Du möchtest eine Pause? Du kannst nur die Produkt-E-Mails abbestellen oder dich komplett abmelden – dann erhältst du keine Produkte und E-Mails mehr.
          </p>
          {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
          <form action={action} className="mt-4 flex flex-col gap-2">
            {notify && (
              <SubmitButton name="mode" value="emails" variant="secondary" size="sm">
                Nur Produkt-E-Mails abbestellen
              </SubmitButton>
            )}
            <SubmitButton
              name="mode"
              value="all"
              variant="outline"
              size="sm"
              confirm="Möchtest du dich wirklich komplett abmelden? Offene Bewerbungen werden zurückgezogen."
            >
              Komplett abmelden
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
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-red-700">
        <Trash2 className="size-4.5" /> Konto löschen
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Löscht dein Konto mit allen Daten, Bewerbungen und Bewertungen unwiderruflich.
      </p>
      {!open ? (
        <Button variant="ghost" size="sm" className="mt-3 -ml-3 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setOpen(true)}>
          Konto löschen …
        </Button>
      ) : (
        <form action={action} className="mt-4 space-y-3">
          <Field label="Zur Bestätigung dein Passwort" name="deletePassword" error={state.fieldErrors?.password}>
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
