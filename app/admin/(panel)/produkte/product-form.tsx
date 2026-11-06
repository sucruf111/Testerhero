"use client";

import { useActionState, useState } from "react";
import { ImageUp, Save } from "lucide-react";
import { saveProductAction } from "@/lib/actions/admin";
import { ProductImage } from "@/components/product-image";
import { Alert, Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { CATEGORIES, PRODUCT_STATUS } from "@/lib/constants";
import type { FormState } from "@/lib/validation";

export type ProductFormValues = {
  id?: string;
  title?: string;
  brand?: string | null;
  category?: string;
  shortDescription?: string;
  description?: string;
  testInstructions?: string | null;
  imageUrl?: string | null;
  amazonUrl?: string | null;
  retailPrice?: string;
  slots?: number | string;
  applicationDeadline?: string | null;
  status?: string;
};

export function ProductForm({ initial = {}, blobEnabled }: { initial?: ProductFormValues; blobEnabled: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(saveProductAction, {});
  const v = { ...initial, ...(state.values ?? {}) } as Record<string, string | undefined>;
  const e = state.fieldErrors ?? {};
  const [preview, setPreview] = useState<string | null>(initial.imageUrl ?? null);
  const [category, setCategory] = useState(v.category ?? CATEGORIES[0]);

  return (
    <form action={action} className="grid gap-8 xl:grid-cols-[1fr_20rem]">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="space-y-6">
        {state.error && <Alert tone="error">{state.error}</Alert>}

        <Section title="Produkt">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Produktname" name="title" error={e.title} className="sm:col-span-2">
              <Input name="title" required defaultValue={v.title ?? ""} error={e.title} placeholder="z. B. Smarter Milchaufschäumer Pro" />
            </Field>
            <Field label="Marke" name="brand" optional error={e.brand}>
              <Input name="brand" defaultValue={v.brand ?? ""} />
            </Field>
            <Field label="Kategorie" name="category" error={e.category}>
              <Select name="category" value={category} onChange={(ev) => setCategory(ev.target.value)} error={e.category}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Kurzbeschreibung" name="shortDescription" hint="Erscheint auf der Produktkarte und in E-Mails (max. 220 Zeichen)." error={e.shortDescription} className="sm:col-span-2">
              <Textarea name="shortDescription" rows={2} maxLength={220} required defaultValue={v.shortDescription ?? ""} error={e.shortDescription} className="min-h-0" />
            </Field>
            <Field label="Ausführliche Beschreibung" name="description" error={e.description} className="sm:col-span-2">
              <Textarea name="description" rows={7} required defaultValue={v.description ?? ""} error={e.description} />
            </Field>
            <Field
              label="Worauf sollen Tester achten?"
              name="testInstructions"
              optional
              hint="Wird auf der Produktseite und beim Bewerten angezeigt."
              error={e.testInstructions}
              className="sm:col-span-2"
            >
              <Textarea name="testInstructions" rows={4} defaultValue={v.testInstructions ?? ""} placeholder={"• Wie einfach ist die Inbetriebnahme?\n• Wie zufrieden bist du mit der Verarbeitung?"} />
            </Field>
          </div>
        </Section>

        <Section title="Bild & Links">
          <div className="grid gap-5 sm:grid-cols-2">
            {blobEnabled && (
              <Field label="Bild hochladen" name="imageFile" optional hint="JPG, PNG oder WebP, max. 4 MB." error={e.imageFile} className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-line bg-cream px-4 py-4 text-sm text-ink-soft transition hover:border-coral-300">
                  <ImageUp className="size-5 text-coral-500" />
                  <span>Datei auswählen …</span>
                  <input
                    id="imageFile"
                    name="imageFile"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(ev) => {
                      const file = ev.target.files?.[0];
                      if (file) setPreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </Field>
            )}
            <Field label={blobEnabled ? "… oder Bild-URL" : "Bild-URL"} name="imageUrl" optional error={e.imageUrl} className="sm:col-span-2">
              <Input
                name="imageUrl"
                type="url"
                defaultValue={v.imageUrl ?? ""}
                error={e.imageUrl}
                placeholder="https://…"
                onBlur={(ev) => ev.target.value && setPreview(ev.target.value)}
              />
            </Field>
            <Field label="Amazon-Link / Referenz" name="amazonUrl" optional hint="Nur intern sichtbar." error={e.amazonUrl} className="sm:col-span-2">
              <Input name="amazonUrl" type="url" defaultValue={v.amazonUrl ?? ""} error={e.amazonUrl} placeholder="https://www.amazon.de/dp/…" />
            </Field>
          </div>
        </Section>
      </div>

      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line/70">
          <div className="aspect-[4/3]">
            <ProductImage src={preview} alt="Vorschau" category={category} />
          </div>
          <p className="px-4 py-3 text-xs text-muted">Vorschau – ohne Bild wird eine Grafik passend zur Kategorie angezeigt.</p>
        </div>

        <Section title="Testplätze & Status">
          <div className="space-y-5">
            <Field label="Status" name="status" error={e.status}>
              <Select name="status" defaultValue={v.status ?? "draft"}>
                {Object.entries(PRODUCT_STATUS).map(([key, s]) => (
                  <option key={key} value={key}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Anzahl Testplätze" name="slots" error={e.slots}>
              <Input name="slots" type="number" min={1} required defaultValue={String(v.slots ?? 10)} error={e.slots} />
            </Field>
            <Field label="Bewerbungsschluss" name="applicationDeadline" optional error={e.applicationDeadline}>
              <Input name="applicationDeadline" type="date" defaultValue={v.applicationDeadline ?? ""} error={e.applicationDeadline} />
            </Field>
            <Field label="Warenwert (€)" name="retailPrice" optional hint="Wird Testern angezeigt." error={e.retailPrice}>
              <Input name="retailPrice" inputMode="decimal" defaultValue={v.retailPrice ?? ""} error={e.retailPrice} placeholder="29,99" />
            </Field>
          </div>
        </Section>

        <SubmitButton size="lg" className="w-full" pendingText="Wird gespeichert …">
          <Save /> {initial.id ? "Änderungen speichern" : "Produkt anlegen"}
        </SubmitButton>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-line/70 sm:p-6">
      <h2 className="mb-5 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
