import "server-only";
import { eq } from "drizzle-orm";
import { after } from "next/server";
import { distribute } from "@/lib/claims";
import { getBaseUrl } from "@/lib/config";
import { db, schema } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { verifyEmailTemplate } from "@/lib/email/templates";
import { signVerifyToken, verifyResetToken, verifyVerifyToken } from "./tokens";

export async function sendVerificationEmail(tester: { id: string; email: string; firstName: string }) {
  const token = await signVerifyToken(tester.id, tester.email);
  const link = `${getBaseUrl()}/email-bestaetigen?token=${token}`;
  await sendEmail(tester, verifyEmailTemplate(tester, link), { transactional: true });
}

/** Bestätigt die E-Mail-Adresse (Double-Opt-in) */
export async function confirmEmail(token: string | null) {
  const data = await verifyVerifyToken(token);
  if (!data) return { ok: false as const };
  const tester = await db.query.testers.findFirst({ where: eq(schema.testers.id, data.testerId) });
  if (!tester || tester.email !== data.email) return { ok: false as const };
  if (!tester.emailVerifiedAt) {
    await db
      .update(schema.testers)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(schema.testers.id, tester.id));
    // Neue Tester können sofort bei freien Plätzen mit ausgelost werden
    after(() => distribute());
  }
  return { ok: true as const, firstName: tester.firstName };
}

export async function currentPasswordHash(id: string) {
  const t = await db.query.testers.findFirst({
    where: eq(schema.testers.id, id),
    columns: { passwordHash: true },
  });
  return t?.passwordHash ?? null;
}

export async function isResetTokenValid(token: string | null) {
  return Boolean(await verifyResetToken(token, currentPasswordHash));
}
