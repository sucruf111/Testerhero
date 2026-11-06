"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/auth/flows";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { endTesterSession, getCurrentTester, requireTester } from "@/lib/auth/session";
import { verifyUnsubscribeToken } from "@/lib/auth/tokens";
import { addressKey } from "@/lib/address";
import { distribute } from "@/lib/claims";
import { unsubscribeTester } from "@/lib/unsubscribe";
import {
  addressSchema,
  emailSchema,
  fieldErrorsOf,
  formValues,
  passwordSchema,
  reviewSchema,
  type FormState,
} from "@/lib/validation";

/* ───────────── Pakete ───────────── */

async function ownApplication(applicationId: string, testerId: string) {
  return db.query.applications.findFirst({
    where: and(eq(schema.applications.id, applicationId), eq(schema.applications.testerId, testerId)),
    with: { product: true },
  });
}

/** Paket ablehnen, solange es noch nicht verschickt wurde. Der Platz wird neu ausgelost. */
export async function withdrawApplicationAction(formData: FormData) {
  const tester = await requireTester();
  const app = await ownApplication(String(formData.get("applicationId")), tester.id);
  if (app && (app.status === "pending" || app.status === "accepted")) {
    await db
      .update(schema.applications)
      .set({ status: "withdrawn" })
      .where(eq(schema.applications.id, app.id));
    after(() => distribute());
  }
  revalidatePath("/konto");
}

export async function confirmReceivedAction(formData: FormData) {
  const tester = await requireTester();
  const app = await ownApplication(String(formData.get("applicationId")), tester.id);
  if (app && app.status === "shipped") {
    await db
      .update(schema.applications)
      .set({ status: "received", receivedAt: new Date() })
      .where(eq(schema.applications.id, app.id));
  }
  revalidatePath("/konto");
}

/* ───────────── Bewertung ───────────── */

export async function submitReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tester = await requireTester();
  const values = formValues(formData);
  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Bitte schau dir die markierten Felder noch mal an.", fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  const app = await ownApplication(parsed.data.applicationId, tester.id);
  if (!app || app.status !== "received") {
    return { error: "Für diesen Test kannst du noch keine Bewertung abgeben.", values };
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(schema.reviews)
      .values({
        applicationId: app.id,
        productId: app.productId,
        testerId: tester.id,
        rating: parsed.data.rating,
        title: parsed.data.title,
        body: parsed.data.body,
        pros: parsed.data.pros,
        cons: parsed.data.cons,
        wouldRecommend: parsed.data.wouldRecommend === "yes",
      })
      .onConflictDoNothing();
    await tx
      .update(schema.applications)
      .set({ status: "reviewed", receivedAt: app.receivedAt ?? new Date() })
      .where(eq(schema.applications.id, app.id));
  });

  // Ein Test weniger offen: vielleicht ist jetzt wieder Platz für ein neues Paket
  after(() => distribute());
  revalidatePath("/konto");
  redirect("/konto?bewertet=1");
}

/* ───────────── Profil ───────────── */

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tester = await requireTester();
  const values = formValues(formData, ["interests"]);
  const parsed = addressSchema.safeParse(values);
  const email = emailSchema.safeParse(values.email);
  if (!parsed.success || !email.success) {
    return {
      error: "Bitte schau dir die markierten Felder noch mal an.",
      fieldErrors: {
        ...(parsed.success ? {} : fieldErrorsOf(parsed.error)),
        ...(email.success ? {} : { email: ["Bitte gib eine gültige E-Mail-Adresse ein."] }),
      },
      values,
    };
  }

  const emailChanged = email.data !== tester.email;
  if (emailChanged) {
    const taken = await db.query.testers.findFirst({
      where: eq(schema.testers.email, email.data),
      columns: { id: true },
    });
    if (taken) {
      return { fieldErrors: { email: ["Diese E-Mail-Adresse wird schon für ein anderes Konto benutzt."] }, values };
    }
  }

  const [updated] = await db
    .update(schema.testers)
    .set({
      ...parsed.data,
      addressKey: addressKey(parsed.data.street, parsed.data.postalCode, parsed.data.country),
      email: email.data,
      ...(emailChanged ? { emailVerifiedAt: null } : {}),
    })
    .where(eq(schema.testers.id, tester.id))
    .returning();

  if (emailChanged) await sendVerificationEmail(updated);

  revalidatePath("/konto", "layout");
  return {
    ok: true,
    message: emailChanged
      ? "Gespeichert. Wir haben dir einen Link an die neue E-Mail-Adresse geschickt. Bitte klick ihn an."
      : "Gespeichert.",
  };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tester = await requireTester();
  const current = String(formData.get("currentPassword") ?? "");
  if (!(await verifyPassword(current, tester.passwordHash))) {
    return { fieldErrors: { currentPassword: ["Das aktuelle Passwort stimmt nicht."] } };
  }
  const next = passwordSchema.safeParse(formData.get("newPassword"));
  if (!next.success) return { fieldErrors: { newPassword: next.error.issues.map((i) => i.message) } };
  await db
    .update(schema.testers)
    .set({ passwordHash: await hashPassword(next.data) })
    .where(eq(schema.testers.id, tester.id));
  return { ok: true, message: "Dein Passwort ist geändert." };
}

/* ───────────── Abmelden / Reaktivieren / Löschen ───────────── */

/** Abmeldung über den Link aus einer E-Mail (ohne Login) oder eingeloggt */
export async function unsubscribeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = formData.get("token");
  let testerId: string | null = null;

  if (typeof token === "string" && token) {
    testerId = (await verifyUnsubscribeToken(token))?.testerId ?? null;
  } else {
    testerId = (await getCurrentTester())?.id ?? null;
  }
  if (!testerId) {
    return { error: "Der Link funktioniert leider nicht. Melde dich an, dann kannst du dich im Profil abmelden." };
  }

  // bewusst kein revalidatePath: die Seite soll die Bestätigung zeigen statt neu zu rendern
  await unsubscribeTester(testerId);
  after(() => distribute());
  return { ok: true, message: "Erledigt. Du bist abgemeldet und bekommst keine Pakete und keine E-Mails mehr von uns." };
}

export async function reactivateAction() {
  const tester = await requireTester();
  if (tester.status === "unsubscribed") {
    await db
      .update(schema.testers)
      .set({ status: "active", unsubscribedAt: null })
      .where(eq(schema.testers.id, tester.id));
    after(() => distribute());
  }
  revalidatePath("/konto", "layout");
  redirect("/konto?reaktiviert=1");
}

export async function deleteAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tester = await requireTester();
  const password = String(formData.get("password") ?? "");
  if (!(await verifyPassword(password, tester.passwordHash))) {
    return { fieldErrors: { password: ["Das Passwort stimmt nicht."] } };
  }
  await db.delete(schema.testers).where(eq(schema.testers.id, tester.id));
  await endTesterSession();
  after(() => distribute());
  redirect("/?konto=geloescht");
}
