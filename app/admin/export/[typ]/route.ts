import { and, asc, desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { getTestersForExport, type TesterFilter } from "@/lib/admin-queries";
import { getAdmin } from "@/lib/auth/session";
import { CATEGORIES, COUNTRIES, TESTER_STATUS } from "@/lib/constants";
import { csvResponse, toCsv } from "@/lib/csv";
import { db, schema } from "@/lib/db";
import { formatDate, todayBerlin } from "@/lib/format";

const uuid = /^[0-9a-f-]{36}$/i;

export async function GET(request: NextRequest, ctx: RouteContext<"/admin/export/[typ]">) {
  if (!(await getAdmin())) return new Response("Nicht angemeldet", { status: 401 });
  const { typ } = await ctx.params;
  const sp = request.nextUrl.searchParams;
  const productId = sp.get("produkt");
  const productFilter = productId && uuid.test(productId) ? productId : null;
  const date = todayBerlin();

  if (typ === "versand") {
    const rows = await db.query.applications.findMany({
      where: and(
        eq(schema.applications.status, "accepted"),
        productFilter ? eq(schema.applications.productId, productFilter) : undefined,
      ),
      with: { tester: true, product: { columns: { title: true } } },
      orderBy: [asc(schema.applications.productId), asc(schema.applications.decidedAt)],
    });
    const csv = toCsv(
      ["Vorname", "Nachname", "Straße und Hausnummer", "Adresszusatz", "PLZ", "Ort", "Land", "E-Mail", "Telefon", "Produkt", "Ausgewählt am"],
      rows.map((r) => [
        r.tester.firstName,
        r.tester.lastName,
        r.tester.street,
        r.tester.addressExtra,
        r.tester.postalCode,
        r.tester.city,
        COUNTRIES[r.tester.country] ?? r.tester.country,
        r.tester.email,
        r.tester.phone,
        r.product.title,
        formatDate(r.decidedAt),
      ]),
    );
    return csvResponse(`versandliste-${date}.csv`, csv);
  }

  if (typ === "tester") {
    const status = ["active", "unverified", "unsubscribed", "blocked"].find((s) => s === sp.get("status")) as TesterFilter["status"];
    const interest = CATEGORIES.find((c) => c === sp.get("interesse"));
    const testers = await getTestersForExport({ q: sp.get("q") ?? undefined, status, interest });
    const csv = toCsv(
      ["Vorname", "Nachname", "E-Mail", "Straße und Hausnummer", "Adresszusatz", "PLZ", "Ort", "Land", "Telefon", "Geburtsjahr", "Interessen", "Status", "E-Mail bestätigt", "Produkt-Mails", "Registriert am"],
      testers.map((t) => [
        t.firstName,
        t.lastName,
        t.email,
        t.street,
        t.addressExtra,
        t.postalCode,
        t.city,
        COUNTRIES[t.country] ?? t.country,
        t.phone,
        t.birthYear,
        t.interests.join(", "),
        TESTER_STATUS[t.status].label,
        t.emailVerifiedAt ? "ja" : "nein",
        t.notifyNewProducts ? "ja" : "nein",
        formatDate(t.createdAt),
      ]),
    );
    return csvResponse(`tester-${date}.csv`, csv);
  }

  if (typ === "bewertungen") {
    const reviews = await db.query.reviews.findMany({
      where: productFilter ? eq(schema.reviews.productId, productFilter) : undefined,
      with: {
        product: { columns: { title: true } },
        tester: { columns: { firstName: true, lastName: true, city: true, birthYear: true } },
      },
      orderBy: desc(schema.reviews.createdAt),
    });
    const csv = toCsv(
      ["Produkt", "Sterne", "Würde empfehlen", "Überschrift", "Bewertung", "Positiv", "Negativ", "Tester", "Ort", "Geburtsjahr", "Datum"],
      reviews.map((r) => [
        r.product.title,
        r.rating,
        r.wouldRecommend ? "ja" : "nein",
        r.title,
        r.body,
        r.pros,
        r.cons,
        `${r.tester.firstName} ${r.tester.lastName}`,
        r.tester.city,
        r.tester.birthYear,
        formatDate(r.createdAt),
      ]),
    );
    return csvResponse(`bewertungen-${date}.csv`, csv);
  }

  return new Response("Unbekannter Export", { status: 404 });
}
