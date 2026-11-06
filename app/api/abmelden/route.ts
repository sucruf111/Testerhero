import { NextResponse, type NextRequest } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/auth/tokens";
import { unsubscribeTester } from "@/lib/unsubscribe";

/**
 * One-Click-Abmeldung (RFC 8058) – wird von Gmail, Apple Mail & Co. über den
 * „List-Unsubscribe“-Header aufgerufen.
 */
export async function POST(request: NextRequest) {
  const data = await verifyUnsubscribeToken(request.nextUrl.searchParams.get("token"));
  if (!data) return NextResponse.json({ ok: false }, { status: 400 });
  await unsubscribeTester(data.testerId, "all");
  return NextResponse.json({ ok: true });
}

/** Wer den Link im Browser öffnet, landet auf der Bestätigungsseite. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  return NextResponse.redirect(new URL(`/abmelden?token=${encodeURIComponent(token)}`, request.url));
}
