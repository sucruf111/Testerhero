import { z } from "zod";
import { CATEGORIES, COUNTRIES } from "@/lib/constants";

const trimmed = (min: number, msg: string, max = 200) =>
  z.string().trim().min(min, msg).max(max, `Maximal ${max} Zeichen.`);

const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max, `Maximal ${max} Zeichen.`)
    .optional()
    .transform((v) => (v ? v : null));

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Bitte gib eine gültige E-Mail-Adresse ein."));

export const passwordSchema = z
  .string()
  .min(8, "Mindestens 8 Zeichen.")
  .max(200, "Das Passwort ist zu lang.");

const currentYear = new Date().getFullYear();

export const addressSchema = z
  .object({
    firstName: trimmed(1, "Bitte gib deinen Vornamen ein.", 80),
    lastName: trimmed(1, "Bitte gib deinen Nachnamen ein.", 80),
    street: trimmed(3, "Bitte gib Straße und Hausnummer ein.", 120),
    addressExtra: optionalText(120),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{4,5}$/, "Bitte gib eine gültige Postleitzahl ein."),
    city: trimmed(2, "Bitte gib deinen Ort ein.", 80),
    country: z.enum(Object.keys(COUNTRIES) as [string, ...string[]], "Bitte wähle ein Land."),
    phone: optionalText(40),
    birthYear: z
      .string()
      .trim()
      .optional()
      .transform((v, ctx) => {
        if (!v) return null;
        const n = Number(v);
        if (!Number.isInteger(n) || n < currentYear - 100 || n > currentYear - 16) {
          ctx.addIssue({ code: "custom", message: "Bitte gib ein gültiges Geburtsjahr ein (ab 16 Jahren)." });
          return z.NEVER;
        }
        return n;
      }),
    interests: z.array(z.enum(CATEGORIES)).default([]),
  })
  .superRefine((data, ctx) => {
    const expectedLength = data.country === "DE" ? 5 : 4;
    if (data.postalCode.length !== expectedLength) {
      ctx.addIssue({
        code: "custom",
        path: ["postalCode"],
        message: data.country === "DE" ? "Bitte gib eine 5-stellige PLZ ein." : "Bitte gib eine 4-stellige PLZ ein.",
      });
    }
  });

export const registerSchema = addressSchema.and(
  z.object({
    email: emailSchema,
    password: passwordSchema,
    notifyNewProducts: z.boolean(),
    consent: z.literal(true, "Bitte stimme den Teilnahmebedingungen und der Datenschutzerklärung zu."),
  }),
);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Bitte gib dein Passwort ein."),
});

export const applySchema = z.object({
  productId: z.uuid(),
  motivation: z
    .string()
    .trim()
    .max(1000, "Maximal 1000 Zeichen.")
    .optional()
    .transform((v) => (v ? v : null)),
});

export const reviewSchema = z.object({
  applicationId: z.uuid(),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Bitte vergib 1 bis 5 Sterne.")
    .max(5, "Bitte vergib 1 bis 5 Sterne."),
  title: trimmed(3, "Bitte gib deiner Bewertung eine Überschrift.", 120),
  body: trimmed(80, "Bitte beschreibe deine Erfahrung etwas ausführlicher (mind. 80 Zeichen).", 5000),
  pros: optionalText(1000),
  cons: optionalText(1000),
  wouldRecommend: z.enum(["yes", "no"], "Bitte wähle aus, ob du das Produkt empfehlen würdest."),
});

export const productSchema = z.object({
  title: trimmed(3, "Bitte gib einen Produktnamen ein.", 140),
  brand: optionalText(80),
  category: z.enum(CATEGORIES, "Bitte wähle eine Kategorie."),
  shortDescription: trimmed(10, "Bitte gib eine Kurzbeschreibung ein (mind. 10 Zeichen).", 220),
  description: trimmed(20, "Bitte beschreibe das Produkt (mind. 20 Zeichen).", 8000),
  testInstructions: optionalText(4000),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^https:\/\/\S+$/.test(v), "Bitte gib eine gültige https-Bild-URL ein."),
  amazonUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^https?:\/\/\S+$/.test(v), "Bitte gib eine gültige URL ein."),
  retailPrice: z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      const n = Number(v.replace(/\./g, "").replace(",", "."));
      if (!Number.isFinite(n) || n < 0) {
        ctx.addIssue({ code: "custom", message: "Bitte gib einen gültigen Preis ein, z. B. 29,99." });
        return z.NEVER;
      }
      return Math.round(n * 100);
    }),
  slots: z.coerce.number().int("Bitte eine ganze Zahl.").min(1, "Mindestens 1 Platz.").max(10000),
  applicationDeadline: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Ungültiges Datum."),
  status: z.enum(["draft", "active", "closed"]),
});

export type FieldErrors = Record<string, string[] | undefined>;

export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: FieldErrors;
  /** Eingaben zurückgeben, damit Formulare nach Fehlern nicht leer sind */
  values?: Record<string, string | string[] | boolean>;
};

export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const flat = z.flattenError(error);
  return flat.fieldErrors as FieldErrors;
}

/** Wandelt FormData in ein einfaches Objekt (Mehrfachwerte → Arrays) */
export function formValues(formData: FormData, multi: string[] = []) {
  const values: Record<string, string | string[]> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$") || typeof value !== "string") continue;
    if (multi.includes(key)) {
      values[key] = [...((values[key] as string[]) ?? []), value];
    } else {
      values[key] = value;
    }
  }
  for (const key of multi) values[key] ??= [];
  return values;
}
