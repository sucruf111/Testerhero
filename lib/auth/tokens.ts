import "server-only";
import { createHash } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { getAuthSecret } from "@/lib/secret";

type Purpose = "session" | "admin" | "verify" | "reset" | "unsub";

async function sign(
  purpose: Purpose,
  subject: string,
  expiresIn: string | null,
  extra: Record<string, unknown> = {},
) {
  let jwt = new SignJWT({ p: purpose, ...extra })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt();
  if (expiresIn) jwt = jwt.setExpirationTime(expiresIn);
  return jwt.sign(getAuthSecret());
}

async function verify(token: string | undefined | null, purpose: Purpose) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), { algorithms: ["HS256"] });
    if (payload.p !== purpose || typeof payload.sub !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

/* Sessions */
export const signTesterSession = (testerId: string) => sign("session", testerId, "30d");
export const verifyTesterSession = (token?: string) => verify(token, "session");

export const signAdminSession = (email: string) => sign("admin", email, "12h");
export const verifyAdminSession = (token?: string) => verify(token, "admin");

/* E-Mail-Bestätigung (Double-Opt-in) */
export const signVerifyToken = (testerId: string, email: string) =>
  sign("verify", testerId, "7d", { e: email });

export async function verifyVerifyToken(token?: string | null) {
  const payload = await verify(token, "verify");
  if (!payload || typeof payload.e !== "string") return null;
  return { testerId: payload.sub as string, email: payload.e };
}

/* Passwort zurücksetzen – wird ungültig, sobald sich das Passwort ändert */
const fingerprint = (passwordHash: string) =>
  createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);

export const signResetToken = (testerId: string, passwordHash: string) =>
  sign("reset", testerId, "1h", { f: fingerprint(passwordHash) });

export async function verifyResetToken(token: string | null | undefined, currentHash: (id: string) => Promise<string | null>) {
  const payload = await verify(token, "reset");
  if (!payload) return null;
  const hash = await currentHash(payload.sub as string);
  if (!hash || payload.f !== fingerprint(hash)) return null;
  return { testerId: payload.sub as string };
}

/* Abmeldelink – läuft nicht ab */
export const signUnsubscribeToken = (testerId: string) => sign("unsub", testerId, null);
export async function verifyUnsubscribeToken(token?: string | null) {
  const payload = await verify(token, "unsub");
  return payload ? { testerId: payload.sub as string } : null;
}
