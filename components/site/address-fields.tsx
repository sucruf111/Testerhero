import { COUNTRIES } from "@/lib/constants";
import { Field, Input, Select } from "@/components/ui/form";
import type { FieldErrors } from "@/lib/validation";

type Values = Record<string, string | string[] | boolean | number | null | undefined>;

const str = (v: Values[string]) => (v == null ? "" : String(v));

export function AddressFields({ values = {}, errors = {} }: { values?: Values; errors?: FieldErrors }) {
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <Field label="Vorname" name="firstName" error={errors.firstName} className="sm:col-span-3">
        <Input name="firstName" autoComplete="given-name" required defaultValue={str(values.firstName)} error={errors.firstName} />
      </Field>
      <Field label="Nachname" name="lastName" error={errors.lastName} className="sm:col-span-3">
        <Input name="lastName" autoComplete="family-name" required defaultValue={str(values.lastName)} error={errors.lastName} />
      </Field>
      <Field label="Straße und Hausnummer" name="street" error={errors.street} className="sm:col-span-4">
        <Input name="street" autoComplete="address-line1" required defaultValue={str(values.street)} error={errors.street} />
      </Field>
      <Field label="Adresszusatz" name="addressExtra" optional error={errors.addressExtra} className="sm:col-span-2">
        <Input name="addressExtra" autoComplete="address-line2" defaultValue={str(values.addressExtra)} />
      </Field>
      <Field label="PLZ" name="postalCode" error={errors.postalCode} className="sm:col-span-2">
        <Input name="postalCode" autoComplete="postal-code" inputMode="numeric" required maxLength={5} defaultValue={str(values.postalCode)} error={errors.postalCode} />
      </Field>
      <Field label="Ort" name="city" error={errors.city} className="sm:col-span-2">
        <Input name="city" autoComplete="address-level2" required defaultValue={str(values.city)} error={errors.city} />
      </Field>
      <Field label="Land" name="country" error={errors.country} className="sm:col-span-2">
        <Select name="country" autoComplete="country" defaultValue={str(values.country) || "DE"} error={errors.country}>
          {Object.entries(COUNTRIES).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Telefon" name="phone" optional hint="Nur falls der Paketdienst Fragen hat" error={errors.phone} className="sm:col-span-3">
        <Input name="phone" type="tel" autoComplete="tel" defaultValue={str(values.phone)} />
      </Field>
      <Field label="Geburtsjahr" name="birthYear" optional error={errors.birthYear} className="sm:col-span-3">
        <Input name="birthYear" inputMode="numeric" maxLength={4} placeholder="z. B. 1990" defaultValue={str(values.birthYear)} error={errors.birthYear} />
      </Field>
    </div>
  );
}
