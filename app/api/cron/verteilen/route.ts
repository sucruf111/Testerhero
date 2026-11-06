import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/lib/auth/password";
import { distribute } from "@/lib/claims";

/**
 * Wird einmal täglich von Vercel Cron aufgerufen (siehe vercel.json).
 * Verteilt freie Plätze, z. B. wenn bei Testern das Monatslimit wieder frei geworden ist.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await distribute();
  return NextResponse.json({ ok: true, ...result });
}
