"use server";

import { and, count, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isBlobConfigured } from "@/lib/config";
import { db, schema } from "@/lib/db";
import type { ApplicationStatus } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { distribute } from "@/lib/claims";
import { sendEmail } from "@/lib/email";
import { assignedTemplate, cancelledTemplate, shippedTemplate } from "@/lib/email/templates";
import { slugify } from "@/lib/format";
import { fieldErrorsOf, formValues, productSchema, type FormState } from "@/lib/validation";

/* ───────────── Produkte ───────────── */

async function uniqueSlug(title: string, excludeId?: string) {
  const base = slugify(title) || "produkt";
  let slug = base;
  for (let i = 2; i < 100; i++) {
    const hit = await db.query.products.findFirst({
      where: eq(schema.products.slug, slug),
      columns: { id: true },
    });
    if (!hit || hit.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function uploadImage(file: File) {
  const { put } = await import("@vercel/blob");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const blob = await put(`produkte/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`, file, {
    access: "public",
    contentType: file.type,
  });
  return blob.url;
}

export async function saveProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "") || null;
  const values = formValues(formData);
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Bitte die markierten Felder prüfen.", fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  const { retailPrice, ...data } = parsed.data;
  let imageUrl = data.imageUrl;

  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return { fieldErrors: { imageFile: ["Bitte ein Bild hochladen (JPG, PNG oder WebP)."] }, values };
    }
    if (file.size > 4 * 1024 * 1024) {
      return { fieldErrors: { imageFile: ["Das Bild darf maximal 4 MB groß sein."] }, values };
    }
    if (!isBlobConfigured()) {
      return { fieldErrors: { imageFile: ["Bild-Upload ist noch nicht eingerichtet. Bitte eine Bild-URL eintragen."] }, values };
    }
    try {
      imageUrl = await uploadImage(file);
    } catch (error) {
      console.error(error);
      return { fieldErrors: { imageFile: ["Upload hat nicht geklappt. Bitte noch mal versuchen."] }, values };
    }
  }

  const record = { ...data, imageUrl, retailPriceCents: retailPrice };
  let productId = id;

  if (id) {
    await db.update(schema.products).set(record).where(eq(schema.products.id, id));
  } else {
    const [created] = await db
      .insert(schema.products)
      .values({ ...record, slug: await uniqueSlug(data.title) })
      .returning({ id: schema.products.id });
    productId = created.id;
  }

  // Aktive Produkte werden sofort an zufällige Tester verteilt
  const result = data.status === "active" && productId ? await distribute(productId) : { assigned: 0 };

  revalidatePath("/", "layout");
  redirect(`/admin/produkte/${productId}?gespeichert=1&verteilt=${result.assigned}`);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const [{ value }] = await db
    .select({ value: count() })
    .from(schema.applications)
    .where(eq(schema.applications.productId, id));
  if (value > 0) {
    redirect(`/admin/produkte/${id}?fehler=bewerbungen`);
  }
  await db.delete(schema.products).where(eq(schema.products.id, id));
  revalidatePath("/", "layout");
  redirect("/admin/produkte?geloescht=1");
}

export async function setProductStatusAction(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const status = z.enum(["draft", "active", "closed"]).parse(formData.get("status"));
  await db.update(schema.products).set({ status }).where(eq(schema.products.id, id));
  const result = status === "active" ? await distribute(id) : { assigned: 0 };
  revalidatePath("/", "layout");
  redirect(`/admin/produkte/${id}?verteilt=${result.assigned}`);
}

/** Freie Plätze sofort neu auslosen (z. B. nachdem neue Tester dazugekommen sind) */
export async function distributeNowAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  const productId = typeof id === "string" && id ? z.uuid().parse(id) : undefined;
  const result = await distribute(productId);
  revalidatePath("/admin", "layout");
  redirect(`${productId ? `/admin/produkte/${productId}` : "/admin"}?verteilt=${result.assigned}`);
}

/* ───────────── Pakete (Zuteilungen) ───────────── */

type AppWithRelations = NonNullable<Awaited<ReturnType<typeof loadApplications>>>[number];

function loadApplications(ids: string[]) {
  return db.query.applications.findMany({
    where: inArray(schema.applications.id, ids),
    with: { tester: true, product: true },
  });
}

async function notify(app: AppWithRelations, status: ApplicationStatus) {
  const { tester } = app;
  if (tester.status !== "active") return;
  if (status === "accepted") await sendEmail(tester, assignedTemplate(tester));
  if (status === "rejected") await sendEmail(tester, cancelledTemplate(tester));
  if (status === "shipped") await sendEmail(tester, shippedTemplate(tester));
}

const statusSchema = z.enum(["accepted", "rejected", "shipped", "received"]);

async function applyStatus(
  ids: string[],
  status: ApplicationStatus,
) {
  const apps = await loadApplications(ids);
  const now = new Date();
  for (const app of apps) {
    // Abgemeldete/gesperrte Tester nicht mehr auswählen oder beliefern
    if (app.tester.status !== "active" && (status === "accepted" || status === "shipped")) continue;
    if (app.status === "withdrawn") continue;
    if (app.status === status && status !== "shipped") continue;

    const patch: Partial<typeof schema.applications.$inferInsert> = { status };
    if (status === "accepted" || status === "rejected") patch.decidedAt = now;
    if (status === "shipped") {
      patch.shippedAt = app.shippedAt ?? now;
    }
    if (status === "received") patch.receivedAt = now;

    const wasStatus = app.status;
    await db.update(schema.applications).set(patch).where(eq(schema.applications.id, app.id));
    if (wasStatus !== status) {
      await notify({ ...app, ...patch } as AppWithRelations, status);
    }
  }
  // Stornierte Plätze gehen direkt an andere Tester
  if (status === "rejected") await distribute();
  revalidatePath("/admin", "layout");
}

export async function updateApplicationAction(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("applicationId"));
  const status = statusSchema.parse(formData.get("status"));
  await applyStatus([id], status);
}

export async function bulkApplicationsAction(formData: FormData) {
  await requireAdmin();
  const ids = z.array(z.uuid()).parse(formData.getAll("ids"));
  const status = statusSchema.parse(formData.get("status"));
  if (ids.length > 0) await applyStatus(ids, status);
}

/* ───────────── Tester ───────────── */

export async function updateTesterNoteAction(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("testerId"));
  const note = String(formData.get("adminNote") ?? "").trim().slice(0, 5000);
  await db.update(schema.testers).set({ adminNote: note || null }).where(eq(schema.testers.id, id));
  revalidatePath(`/admin/tester/${id}`);
}

export async function setTesterStatusAction(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("testerId"));
  const status = z.enum(["active", "blocked", "unsubscribed"]).parse(formData.get("status"));
  await db
    .update(schema.testers)
    .set({
      status,
      unsubscribedAt: status === "unsubscribed" ? new Date() : null,
      ...(status !== "active" ? { notifyNewProducts: false } : {}),
    })
    .where(eq(schema.testers.id, id));
  if (status !== "active") {
    await db
      .update(schema.applications)
      .set({ status: "withdrawn" })
      .where(and(eq(schema.applications.testerId, id), inArray(schema.applications.status, ["pending", "accepted"])));
  }
  await distribute();
  revalidatePath("/admin", "layout");
}

export async function deleteTesterAction(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("testerId"));
  await db.delete(schema.testers).where(eq(schema.testers.id, id));
  await distribute();
  revalidatePath("/admin", "layout");
  redirect("/admin/tester?geloescht=1");
}

/* ───────────── Einstellungen ───────────── */

const settingsSchema = z.object({
  maxClaimsPerWindow: z.coerce.number().int().min(1, "Mindestens 1.").max(100, "Höchstens 100."),
  claimWindowDays: z.coerce.number().int().min(1, "Mindestens 1 Tag.").max(365, "Höchstens 365 Tage."),
  maxOpenTests: z.coerce.number().int().min(1, "Mindestens 1.").max(50, "Höchstens 50."),
});

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = formValues(formData);
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Bitte die markierten Felder prüfen.", fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  await db
    .insert(schema.settings)
    .values({ id: 1, ...parsed.data })
    .onConflictDoUpdate({ target: schema.settings.id, set: parsed.data });
  await distribute();
  revalidatePath("/", "layout");
  return { ok: true, message: "Gespeichert." };
}
