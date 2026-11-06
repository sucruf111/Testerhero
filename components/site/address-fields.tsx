import { CATEGORIES, COUNTRIES } from "@/lib/constants";
import { Chip, Field, Input, Select } from "@/components/ui/form";
import type { FieldErrors } from "@/lib/validation";

type Values = Record<string, string | string[] | boolean | number | null | undefined>;

const str = (v: Values[string]) => (v == null ? "" : String(v));

export function AddressFields({ values = {}, errors = {} }: { values?: Values; errors?: FieldErrors }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Vorname" name="firstName" error={errors.firstName}>
        <Input name="firstName" autoComplete="given-name" required defaultValue={str(values.firstName)} error={errors.firstName} />
      </Field>
      <Field label="Nachname" name="lastName" error={errors.lastName}>
        <Input name="lastName" autoComplete="family-name" required defaultValue={str(values.lastName)} error={errors.lastName} />
      </Field>
      <Field label="Straße und Hausnummer" name="street" error={errors.street} className="sm:col-span-2">
        <Input name="street" autoComplete="address-line1" required defaultValue={str(values.street)} error={errors.street} placeholder="Musterstraße 12" />
      </Field>
      <Field label="Adresszusatz" name="addressExtra" optional error={errors.addressExtra} className="sm:col-span-2">
        <Input name="addressExtra" autoComplete="address-line2" defaultValue={str(values.addressExtra)} placeholder="z. B. Hinterhaus, c/o, Packstation" />
      </Field>
      <div className="grid grid-cols-[7rem_1fr] gap-4 sm:col-span-2 sm:grid-cols-[8rem_1fr_12rem]">
        <Field label="PLZ" name="postalCode" error={errors.postalCode}>
          <Input name="postalCode" autoComplete="postal-code" inputMode="numeric" required maxLength={5} defaultValue={str(values.postalCode)} error={errors.postalCode} />
        </Field>
        <Field label="Ort" name="city" error={errors.city}>
          <Input name="city" autoComplete="address-level2" required defaultValue={str(values.city)} error={errors.city} />
        </Field>
        <Field label="Land" name="country" error={errors.country} className="col-span-2 sm:col-span-1">
          <Select name="country" autoComplete="country" defaultValue={str(values.country) || "DE"} error={errors.country}>
            {Object.entries(COUNTRIES).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Telefon" name="phone" optional hint="Nur für Rückfragen des Paketdienstes." error={errors.phone}>
        <Input name="phone" type="tel" autoComplete="tel" defaultValue={str(values.phone)} />
      </Field>
      <Field label="Geburtsjahr" name="birthYear" optional hint="Hilft uns bei der passenden Auswahl." error={errors.birthYear}>
        <Input name="birthYear" inputMode="numeric" maxLength={4} placeholder="z. B. 1990" defaultValue={str(values.birthYear)} error={errors.birthYear} />
      </Field>
    </div>
  );
}

export function InterestFields({ selected = [] }: { selected?: string[] }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">Was interessiert dich?</legend>
      <p className="mt-1 text-sm text-muted">Wähle beliebig viele Kategorien – so finden wir passende Tests für dich.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Chip key={c} name="interests" value={c} label={c} defaultChecked={selected.includes(c)} />
        ))}
      </div>
    </fieldset>
  );
}
