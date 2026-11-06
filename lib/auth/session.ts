import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import {
  signAdminSession,
  signTesterSession,
  verifyAdminSession,
  verifyTesterSession,
} from "./tokens";

export const TESTER_COOKIE = "th_session";
export const ADMIN_COOKIE = "th_admin";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/* ───────────── Tester ───────────── */

export async function startTesterSession(testerId: string) {
  const token = await signTesterSession(testerId);
  (await cookies()).set(TESTER_COOKIE, token, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
}

export async function endTesterSession() {
  (await cookies()).delete(TESTER_COOKIE);
}

/** Aktuell eingeloggter Tester (oder null). Pro Request gecacht. */
export const getCurrentTester = cache(async () => {
  const token = (await cookies()).get(TESTER_COOKIE)?.value;
  const payload = await verifyTesterSession(token);
  if (!payload) return null;
  const tester = await db.query.testers.findFirst({
    where: eq(schema.testers.id, payload.sub as string),
  });
  return tester ?? null;
});

export async function requireTester(next?: string) {
  const tester = await getCurrentTester();
  if (!tester) {
    redirect(next ? `/anmelden?weiter=${encodeURIComponent(next)}` : "/anmelden");
  }
  return tester;
}

/* ───────────── Agentur / Admin ───────────── */

export async function startAdminSession(email: string) {
  const token = await signAdminSession(email);
  (await cookies()).set(ADMIN_COOKIE, token, { ...cookieBase, maxAge: 60 * 60 * 12 });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export const getAdmin = cache(async () => {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const payload = await verifyAdminSession(token);
  return payload ? { email: payload.sub as string } : null;
});

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
