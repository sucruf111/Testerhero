"use server";

import { and, arrayContains, count, eq, inArray, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isBlobConfigured } from "@/lib/config";
import { db, schema } from "@/lib/db";
import type { ApplicationStatus } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { sendBulkEmail, sendEmail } from "@/lib/email";
import {
  acceptedTemplate,
  newProductTemplate,
  rejectedTemplate,
  shippedTemplate,
} from "@/lib/email/templates";
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
    return { error: "Bitte prüfe die markierten Felder.", fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  const { retailPrice, ...data } = parsed.data;
  let imageUrl = data.imageUrl;

  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return { fieldErrors: { imageFile: ["Bitte lade eine Bilddatei hoch (JPG, PNG, WebP)."] }, values };
    }
    if (file.size > 4 * 1024 * 1024) {
      return { fieldErrors: { imageFile: ["Das Bild darf maximal 4 MB groß sein."] }, values };
    }
    if (!isBlobConfigured()) {
      return { fieldErrors: { imageFile: ["Bild-Upload ist nicht eingerichtet. Bitte eine Bild-URL angeben."] }, values };
    }
    try {
      imageUrl = await uploadImage(file);
    } catch (error) {
      console.error(error);
      return { fieldErrors: { imageFile: ["Upload fehlgeschlagen. Bitte erneut versuchen."] }, values };
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

  revalidatePath("/", "layout");
  redirect(`/admin/produkte/${productId}?gespeichert=1`);
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
  revalidatePath("/", "layout");
}

/** Informiert alle aktiven Tester (optional nur passende Interessen) über ein neues Produkt */
export async function notifyTestersAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const onlyInterested = formData.get("onlyInterested") === "on";
  const product = await db.query.products.findFirst({ where: eq(schema.products.id, id) });
  if (!product) return { error: "Produkt nicht gefunden." };
  if (product.status !== "active") {
    return { error: "Bitte setze das Produkt zuerst auf „Bewerbung offen“." };
  }

  const recipients = await db
    .select({ id: schema.testers.id, email: schema.testers.email, firstName: schema.testers.firstName })
    .from(schema.testers)
    .where(
      and(
        eq(schema.testers.status, "active"),
        eq(schema.testers.notifyNewProducts, true),
        isNotNull(schema.testers.emailVerifiedAt),
        onlyInterested ? arrayContains(schema.testers.interests, [product.category]) : undefined,
      ),
    );

  if (recipients.length === 0) {
    return { error: "Es gibt aktuell keine passenden Tester mit aktivierten Benachrichtigungen." };
  }

  try {
    const result = await sendBulkEmail(recipients, (r) => newProductTemplate(r, product));
    await db.update(schema.products).set({ notifiedAt: new Date() }).where(eq(schema.products.id, id));
    revalidatePath(`/admin/produkte/${id}`);
    return {
      ok: true,
      message: result.simulated
        ? `${result.sent} E-Mails vorbereitet (Testmodus: E-Mail-Versand ist noch nicht eingerichtet).`
        : `${result.sent} Tester wurden per E-Mail informiert.`,
    };
  } catch (error) {
    console.error(error);
    return { error: "Der Versand ist fehlgeschlagen. Bitte prüfe die E-Mail-Einstellungen." };
  }
}

/* ───────────── Bewerbungen ───────────── */

type AppWithRelations = NonNullable<Awaited<ReturnType<typeof loadApplications>>>[number];

function loadApplications(ids: string[]) {
  return db.query.applications.findMany({
    where: inArray(schema.applications.id, ids),
    with: { tester: true, product: true },
  });
}

async function notify(app: AppWithRelations, status: ApplicationStatus) {
  const { tester, product } = app;
  if (tester.status !== "active") return;
  if (status === "accepted") await sendEmail(tester, acceptedTemplate(tester, product));
  if (status === "rejected") await sendEmail(tester, rejectedTemplate(tester, product));
  if (status === "shipped") {
    await sendEmail(tester, shippedTemplate(tester, product, app));
  }
}

const statusSchema = z.enum(["pending", "accepted", "rejected", "shipped", "received", "reviewed"]);

async function applyStatus(
  ids: string[],
  status: ApplicationStatus,
  extra: { carrier?: string | null; trackingNumber?: string | null } = {},
) {
  const apps = await loadApplications(ids);
  const now = new Date();
  for (const app of apps) {
    // Abgemeldete/gesperrte Tester nicht mehr auswählen oder beliefern
    if (app.tester.status !== "active" && (status === "accepted" || status === "shipped")) continue;
    if (app.status === "withdrawn" && status !== "pending") continue;
    if (app.status === status && status !== "shipped") continue;

    const patch: Partial<typeof schema.applications.$inferInsert> = { status };
    if (status === "accepted" || status === "rejected") patch.decidedAt = now;
    if (status === "pending") patch.decidedAt = null;
    if (status === "shipped") {
      patch.shippedAt = app.shippedAt ?? now;
      if (extra.carrier !== undefined) patch.carrier = extra.carrier;
      if (extra.trackingNumber !== undefined) patch.trackingNumber = extra.trackingNumber;
    }
    if (status === "received") patch.receivedAt = now;

    const wasStatus = app.status;
    await db.update(schema.applications).set(patch).where(eq(schema.applications.id, app.id));
    if (wasStatus !== status) {
      await notify({ ...app, ...patch } as AppWithRelations, status);
    }
  }
  const productIds = [...new Set(apps.map((a) => a.productId))];
  for (const pid of productIds) revalidatePath(`/admin/produkte/${pid}`);
  revalidatePath("/admin", "layout");
}

export async function updateApplicationAction(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("applicationId"));
  const status = statusSchema.parse(formData.get("status"));
  const carrier = String(formData.get("carrier") ?? "").trim() || null;
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim() || null;
  await applyStatus([id], status, status === "shipped" ? { carrier, trackingNumber } : {});
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
  revalidatePath("/admin", "layout");
}

export async function deleteTesterAction(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("testerId"));
  await db.delete(schema.testers).where(eq(schema.testers.id, id));
  revalidatePath("/admin", "layout");
  redirect("/admin/tester?geloescht=1");
}
