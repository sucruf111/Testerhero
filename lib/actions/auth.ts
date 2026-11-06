"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getBaseUrl } from "@/lib/config";
import { db, schema } from "@/lib/db";
import { hashPassword, safeEqual, verifyPassword } from "@/lib/auth/password";
import {
  endAdminSession,
  endTesterSession,
  getCurrentTester,
  startAdminSession,
  startTesterSession,
} from "@/lib/auth/session";
import { currentPasswordHash, sendVerificationEmail } from "@/lib/auth/flows";
import { signResetToken, verifyResetToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";
import { passwordResetTemplate } from "@/lib/email/templates";
import {
  emailSchema,
  fieldErrorsOf,
  formValues,
  loginSchema,
  passwordSchema,
  registerSchema,
  type FormState,
} from "@/lib/validation";

/** Nur interne, relative Weiterleitungen zulassen */
function safeNext(value: FormDataEntryValue | null, fallback: string) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/* ───────────── Registrierung ───────────── */

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["interests"]);
  const parsed = registerSchema.safeParse({
    ...values,
    notifyNewProducts: formData.get("notifyNewProducts") === "on",
    consent: formData.get("consent") === "on",
  });
  const echo = {
    ...values,
    password: "",
    notifyNewProducts: formData.get("notifyNewProducts") === "on" ? "on" : "off",
  };
  if (!parsed.success) {
    return { error: "Bitte prüfe deine Eingaben.", fieldErrors: fieldErrorsOf(parsed.error), values: echo };
  }
  const data = parsed.data;

  const existing = await db.query.testers.findFirst({
    where: eq(schema.testers.email, data.email),
    columns: { id: true },
  });
  if (existing) {
    return {
      error: "Für diese E-Mail-Adresse gibt es bereits ein Konto.",
      fieldErrors: { email: ["Diese E-Mail-Adresse ist bereits registriert. Melde dich stattdessen an."] },
      values: echo,
    };
  }

  const [tester] = await db
    .insert(schema.testers)
    .values({
      email: data.email,
      passwordHash: await hashPassword(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
      street: data.street,
      addressExtra: data.addressExtra,
      postalCode: data.postalCode,
      city: data.city,
      country: data.country,
      phone: data.phone,
      birthYear: data.birthYear,
      interests: data.interests,
      notifyNewProducts: data.notifyNewProducts,
      consentAt: new Date(),
      lastLoginAt: new Date(),
    })
    .returning();

  await sendVerificationEmail(tester);
  await startTesterSession(tester.id);
  redirect("/konto?willkommen=1");
}

/* ───────────── Login / Logout ───────────── */

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(formValues(formData));
  const echo = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) {
    return { error: "Bitte prüfe deine Eingaben.", fieldErrors: fieldErrorsOf(parsed.error), values: echo };
  }
  const tester = await db.query.testers.findFirst({
    where: eq(schema.testers.email, parsed.data.email),
  });
  const valid = tester ? await verifyPassword(parsed.data.password, tester.passwordHash) : false;
  if (!tester || !valid) {
    return { error: "E-Mail-Adresse oder Passwort ist nicht korrekt.", values: echo };
  }
  await db.update(schema.testers).set({ lastLoginAt: new Date() }).where(eq(schema.testers.id, tester.id));
  await startTesterSession(tester.id);
  redirect(safeNext(formData.get("weiter"), "/konto"));
}

export async function logoutAction() {
  await endTesterSession();
  redirect("/");
}

/* ───────────── E-Mail bestätigen ───────────── */

export async function resendVerificationAction(_prev: FormState): Promise<FormState> {
  const tester = await getCurrentTester();
  if (!tester) redirect("/anmelden");
  if (tester.emailVerifiedAt) return { ok: true, message: "Deine E-Mail-Adresse ist bereits bestätigt." };
  await sendVerificationEmail(tester);
  return { ok: true, message: `Wir haben dir eine neue Bestätigungs-E-Mail an ${tester.email} geschickt.` };
}

/* ───────────── Passwort vergessen ───────────── */

export async function requestPasswordResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { fieldErrors: { email: ["Bitte gib eine gültige E-Mail-Adresse ein."] } };
  }
  const tester = await db.query.testers.findFirst({ where: eq(schema.testers.email, parsed.data) });
  if (tester) {
    const token = await signResetToken(tester.id, tester.passwordHash);
    const link = `${getBaseUrl()}/passwort-zuruecksetzen?token=${token}`;
    await sendEmail(tester, passwordResetTemplate(tester, link), { transactional: true });
  }
  // Immer dieselbe Antwort – verrät nicht, ob ein Konto existiert
  return {
    ok: true,
    message: "Falls ein Konto mit dieser Adresse existiert, haben wir dir einen Link zum Zurücksetzen geschickt.",
  };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const data = await verifyResetToken(String(formData.get("token") ?? ""), currentPasswordHash);
  if (!data) {
    return { error: "Der Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen an." };
  }
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) {
    return { fieldErrors: { password: password.error.issues.map((i) => i.message) } };
  }
  if (formData.get("password") !== formData.get("passwordConfirm")) {
    return { fieldErrors: { passwordConfirm: ["Die Passwörter stimmen nicht überein."] } };
  }
  await db
    .update(schema.testers)
    .set({ passwordHash: await hashPassword(password.data), lastLoginAt: new Date() })
    .where(eq(schema.testers.id, data.testerId));
  await startTesterSession(data.testerId);
  redirect("/konto?passwort=neu");
}

/* ───────────── Agentur-Login ───────────── */

export async function adminLoginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const expectedEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!expectedEmail || !expectedPassword) {
    return { error: "Der Admin-Zugang ist noch nicht eingerichtet (ADMIN_EMAIL / ADMIN_PASSWORD fehlen)." };
  }
  const ok = safeEqual(email, expectedEmail) && safeEqual(password, expectedPassword);
  if (!ok) {
    // kleine Verzögerung gegen Brute-Force
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Zugangsdaten sind nicht korrekt.", values: { email } };
  }
  await startAdminSession(email);
  redirect("/admin");
}

export async function adminLogoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}
