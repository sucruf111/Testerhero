"use client";

import { useActionState, useState } from "react";
import { ImageUp, Save } from "lucide-react";
import { saveProductAction } from "@/lib/actions/admin";
import { ProductImage } from "@/components/product-image";
import { Alert, Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { CATEGORIES } from "@/lib/constants";
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
  adult?: boolean;
};

export function ProductForm({ initial = {}, blobEnabled }: { initial?: ProductFormValues; blobEnabled: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(saveProductAction, {});
  const v = { ...initial, ...(state.values ?? {}) } as Record<string, string | undefined>;
  const e = state.fieldErrors ?? {};
  const [preview, setPreview] = useState<string | null>(initial.imageUrl ?? null);
  const [category, setCategory] = useState(v.category ?? CATEGORIES[0]);
  const adultChecked = state.values ? state.values.adult === "on" : Boolean(initial.adult);

  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[1fr_18rem]">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="space-y-5">
        {state.error && <Alert tone="error">{state.error}</Alert>}

        <Section title="Produkt">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Produktname" name="title" error={e.title} className="sm:col-span-2">
              <Input name="title" required defaultValue={v.title ?? ""} error={e.title} />
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
            <Field label="Kurzbeschreibung" name="shortDescription" hint="Ein, zwei Sätze. Sehen Tester nach dem Auspacken." error={e.shortDescription} className="sm:col-span-2">
              <Textarea name="shortDescription" rows={2} maxLength={220} required defaultValue={v.shortDescription ?? ""} error={e.shortDescription} className="min-h-0" />
            </Field>
            <Field label="Beschreibung" name="description" error={e.description} className="sm:col-span-2">
              <Textarea name="description" rows={5} required defaultValue={v.description ?? ""} error={e.description} />
            </Field>
            <Field
              label="Worauf sollen Tester achten?"
              name="testInstructions"
              optional
              hint="Wird Testern beim Bewerten angezeigt."
              error={e.testInstructions}
              className="sm:col-span-2"
            >
              <Textarea name="testInstructions" rows={4} defaultValue={v.testInstructions ?? ""} placeholder={"Wie einfach ist der Aufbau?\nWie gut ist die Verarbeitung?"} />
            </Field>
          </div>
        </Section>

        <Section title="Bild & Links">
          <div className="grid gap-4 sm:grid-cols-2">
            {blobEnabled && (
              <Field label="Bild hochladen" name="imageFile" optional hint="JPG, PNG oder WebP, höchstens 4 MB" error={e.imageFile} className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-cream px-4 py-3 text-sm text-ink-soft transition hover:border-coral-300">
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
            <Field label="Amazon-Link / Referenz" name="amazonUrl" optional hint="Nur für euch sichtbar" error={e.amazonUrl} className="sm:col-span-2">
              <Input name="amazonUrl" type="url" defaultValue={v.amazonUrl ?? ""} error={e.amazonUrl} placeholder="https://www.amazon.de/dp/…" />
            </Field>
          </div>
        </Section>
      </div>

      <div className="space-y-5">
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="aspect-[4/3]">
            <ProductImage src={preview} alt="Vorschau" category={category} />
          </div>
          <p className="px-3 py-2 text-xs text-muted">Vorschau. Ohne Bild zeigen wir ein Symbol zur Kategorie.</p>
        </div>

        <Section title="Verteilung">
          <div className="space-y-4">
            <Field label="Status" name="status" error={e.status}>
              <Select name="status" defaultValue={v.status ?? "draft"}>
                <option value="draft">Entwurf (wird nicht verteilt)</option>
                <option value="active">Aktiv (wird sofort verteilt)</option>
                <option value="closed">Beendet</option>
              </Select>
            </Field>
            <Checkbox
              name="adult"
              defaultChecked={adultChecked}
              label="Erotikprodukt"
              description="Geht nur an Tester ab 18, die Erotikprodukte ausdrücklich erlaubt haben."
            />
            <Field label="Wie viele Pakete?" name="slots" error={e.slots}>
              <Input name="slots" type="number" min={1} required defaultValue={String(v.slots ?? 10)} error={e.slots} />
            </Field>
            <Field label="Verteilen bis" name="applicationDeadline" optional hint="Danach wird nicht mehr nachverteilt" error={e.applicationDeadline}>
              <Input name="applicationDeadline" type="date" defaultValue={v.applicationDeadline ?? ""} error={e.applicationDeadline} />
            </Field>
            <Field label="Warenwert (€)" name="retailPrice" optional hint="Nur für euch sichtbar" error={e.retailPrice}>
              <Input name="retailPrice" inputMode="decimal" defaultValue={v.retailPrice ?? ""} error={e.retailPrice} placeholder="29,99" />
            </Field>
          </div>
        </Section>

        <SubmitButton size="lg" className="w-full" pendingText="Einen Moment …">
          <Save /> {initial.id ? "Speichern" : "Produkt anlegen"}
        </SubmitButton>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-4 sm:p-5">
      <h2 className="mb-4 text-[15px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}
