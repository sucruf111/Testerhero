"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { addressKey } from "@/lib/address";
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
  const checked = (name: string) => formData.get(name) === "on";
  const parsed = registerSchema.safeParse({
    ...values,
    consent: checked("consent"),
    adult: checked("adult"),
  });
  const echo = {
    ...values,
    password: "",
    consent: checked("consent") ? "on" : "",
    adult: checked("adult") ? "on" : "",
    adultOptIn: checked("adultOptIn") ? "on" : "",
  };
  if (!parsed.success) {
    return { error: "Bitte schau dir die markierten Felder noch mal an.", fieldErrors: fieldErrorsOf(parsed.error), values: echo };
  }
  const data = parsed.data;

  const existing = await db.query.testers.findFirst({
    where: eq(schema.testers.email, data.email),
    columns: { id: true },
  });
  if (existing) {
    return {
      error: "Mit dieser E-Mail-Adresse gibt es schon ein Konto.",
      fieldErrors: { email: ["Diese Adresse ist schon registriert. Melde dich einfach an."] },
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
      addressKey: addressKey(data.street, data.postalCode, data.country),
      phone: data.phone,
      birthYear: data.birthYear,
      consentAt: new Date(),
      ageConfirmedAt: new Date(),
      adultOptIn: checked("adultOptIn"),
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
    return { error: "Bitte schau dir die markierten Felder noch mal an.", fieldErrors: fieldErrorsOf(parsed.error), values: echo };
  }
  const tester = await db.query.testers.findFirst({
    where: eq(schema.testers.email, parsed.data.email),
  });
  const valid = tester ? await verifyPassword(parsed.data.password, tester.passwordHash) : false;
  if (!tester || !valid) {
    return { error: "E-Mail-Adresse oder Passwort stimmt nicht.", values: echo };
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
  if (tester.emailVerifiedAt) return { ok: true, message: "Deine E-Mail-Adresse ist schon bestätigt." };
  await sendVerificationEmail(tester);
  return { ok: true, message: `Wir haben dir den Link noch mal an ${tester.email} geschickt.` };
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
    message: "Wenn es ein Konto mit dieser Adresse gibt, bekommst du gleich eine E-Mail mit einem Link.",
  };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const data = await verifyResetToken(String(formData.get("token") ?? ""), currentPasswordHash);
  if (!data) {
    return { error: "Der Link ist abgelaufen oder wurde schon benutzt. Fordere bitte einen neuen an." };
  }
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) {
    return { fieldErrors: { password: password.error.issues.map((i) => i.message) } };
  }
  if (formData.get("password") !== formData.get("passwordConfirm")) {
    return { fieldErrors: { passwordConfirm: ["Die beiden Passwörter sind nicht gleich."] } };
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
    return { error: "Der Zugang ist noch nicht eingerichtet. ADMIN_EMAIL und ADMIN_PASSWORD fehlen." };
  }
  const ok = safeEqual(email, expectedEmail) && safeEqual(password, expectedPassword);
  if (!ok) {
    // kleine Verzögerung gegen Brute-Force
    await new Promise((r) => setTimeout(r, 600));
    return { error: "E-Mail oder Passwort stimmt nicht.", values: { email } };
  }
  await startAdminSession(email);
  redirect("/admin");
}

export async function adminLogoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}
