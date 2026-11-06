"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/auth/flows";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { endTesterSession, getCurrentTester, requireTester } from "@/lib/auth/session";
import { verifyUnsubscribeToken } from "@/lib/auth/tokens";
import { isDeadlinePassed } from "@/lib/format";
import { unsubscribeTester } from "@/lib/unsubscribe";
import {
  addressSchema,
  applySchema,
  emailSchema,
  fieldErrorsOf,
  formValues,
  passwordSchema,
  reviewSchema,
  type FormState,
} from "@/lib/validation";

/* ───────────── Bewerben ───────────── */

export async function applyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tester = await requireTester();
  const parsed = applySchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: "Ungültige Anfrage.", fieldErrors: fieldErrorsOf(parsed.error) };

  if (tester.status !== "active") {
    return { error: "Dein Konto ist derzeit nicht aktiv. Du kannst dich deshalb nicht bewerben." };
  }
  if (!tester.emailVerifiedAt) {
    return { error: "Bitte bestätige zuerst deine E-Mail-Adresse – den Link findest du in deinem Postfach." };
  }

  const product = await db.query.products.findFirst({
    where: eq(schema.products.id, parsed.data.productId),
  });
  if (!product || product.status !== "active" || isDeadlinePassed(product.applicationDeadline)) {
    return { error: "Für dieses Produkt sind leider keine Bewerbungen mehr möglich." };
  }

  const existing = await db.query.applications.findFirst({
    where: and(
      eq(schema.applications.productId, product.id),
      eq(schema.applications.testerId, tester.id),
    ),
  });
  if (existing && existing.status !== "withdrawn") {
    return { error: "Du hast dich für dieses Produkt bereits beworben." };
  }

  if (existing) {
    await db
      .update(schema.applications)
      .set({ status: "pending", motivation: parsed.data.motivation, decidedAt: null })
      .where(eq(schema.applications.id, existing.id));
  } else {
    await db
      .insert(schema.applications)
      .values({ productId: product.id, testerId: tester.id, motivation: parsed.data.motivation })
      .onConflictDoNothing();
  }

  revalidatePath(`/produkte/${product.slug}`);
  revalidatePath("/konto");
  return { ok: true, message: "Deine Bewerbung ist eingegangen! Wir melden uns per E-Mail, sobald die Auswahl steht." };
}

async function ownApplication(applicationId: string, testerId: string) {
  return db.query.applications.findFirst({
    where: and(eq(schema.applications.id, applicationId), eq(schema.applications.testerId, testerId)),
    with: { product: true },
  });
}

export async function withdrawApplicationAction(formData: FormData) {
  const tester = await requireTester();
  const app = await ownApplication(String(formData.get("applicationId")), tester.id);
  if (app && app.status === "pending") {
    await db
      .update(schema.applications)
      .set({ status: "withdrawn" })
      .where(eq(schema.applications.id, app.id));
  }
  revalidatePath("/konto");
}

export async function confirmReceivedAction(formData: FormData) {
  const tester = await requireTester();
  const app = await ownApplication(String(formData.get("applicationId")), tester.id);
  if (app && (app.status === "shipped" || app.status === "accepted")) {
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
    return { error: "Bitte prüfe deine Eingaben.", fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  const app = await ownApplication(parsed.data.applicationId, tester.id);
  if (!app || !["shipped", "received"].includes(app.status)) {
    return { error: "Für diesen Test kann (noch) keine Bewertung abgegeben werden.", values };
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
      error: "Bitte prüfe deine Eingaben.",
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
      return { fieldErrors: { email: ["Diese E-Mail-Adresse wird bereits verwendet."] }, values };
    }
  }

  const [updated] = await db
    .update(schema.testers)
    .set({
      ...parsed.data,
      email: email.data,
      notifyNewProducts: formData.get("notifyNewProducts") === "on",
      ...(emailChanged ? { emailVerifiedAt: null } : {}),
    })
    .where(eq(schema.testers.id, tester.id))
    .returning();

  if (emailChanged) await sendVerificationEmail(updated);

  revalidatePath("/konto", "layout");
  return {
    ok: true,
    message: emailChanged
      ? "Gespeichert! Bitte bestätige deine neue E-Mail-Adresse über den Link, den wir dir geschickt haben."
      : "Deine Angaben wurden gespeichert.",
  };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tester = await requireTester();
  const current = String(formData.get("currentPassword") ?? "");
  if (!(await verifyPassword(current, tester.passwordHash))) {
    return { fieldErrors: { currentPassword: ["Das aktuelle Passwort ist nicht korrekt."] } };
  }
  const next = passwordSchema.safeParse(formData.get("newPassword"));
  if (!next.success) return { fieldErrors: { newPassword: next.error.issues.map((i) => i.message) } };
  await db
    .update(schema.testers)
    .set({ passwordHash: await hashPassword(next.data) })
    .where(eq(schema.testers.id, tester.id));
  return { ok: true, message: "Dein Passwort wurde geändert." };
}

/* ───────────── Abmelden / Reaktivieren / Löschen ───────────── */

/** Abmeldung über den Link aus einer E-Mail (ohne Login) oder eingeloggt */
export async function unsubscribeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const mode = formData.get("mode") === "emails" ? "emails" : "all";
  const token = formData.get("token");
  let testerId: string | null = null;

  if (typeof token === "string" && token) {
    testerId = (await verifyUnsubscribeToken(token))?.testerId ?? null;
  } else {
    testerId = (await getCurrentTester())?.id ?? null;
  }
  if (!testerId) {
    return { error: "Der Abmeldelink ist ungültig. Bitte melde dich an, um dich abzumelden." };
  }

  // bewusst kein revalidatePath: die Seite soll die Bestätigung zeigen statt neu zu rendern
  await unsubscribeTester(testerId, mode);
  return {
    ok: true,
    message:
      mode === "emails"
        ? "Erledigt – du bekommst keine E-Mails mehr zu neuen Produkttests."
        : "Du wurdest abgemeldet. Du erhältst ab sofort keine Produkte und keine E-Mails mehr von uns.",
  };
}

export async function reactivateAction() {
  const tester = await requireTester();
  if (tester.status === "unsubscribed") {
    await db
      .update(schema.testers)
      .set({ status: "active", unsubscribedAt: null, notifyNewProducts: true })
      .where(eq(schema.testers.id, tester.id));
  }
  revalidatePath("/konto", "layout");
  redirect("/konto?reaktiviert=1");
}

export async function deleteAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tester = await requireTester();
  const password = String(formData.get("password") ?? "");
  if (!(await verifyPassword(password, tester.passwordHash))) {
    return { fieldErrors: { password: ["Das Passwort ist nicht korrekt."] } };
  }
  await db.delete(schema.testers).where(eq(schema.testers.id, tester.id));
  await endTesterSession();
  redirect("/?konto=geloescht");
}
