import "server-only";
import { and, count, eq, gte, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Settings } from "@/lib/db/schema";
import { sendBulkEmail } from "@/lib/email";
import { assignedTemplate } from "@/lib/email/templates";
import { todayBerlin } from "@/lib/format";

export const DEFAULT_SETTINGS: Omit<Settings, "id" | "updatedAt"> = {
  maxClaimsPerWindow: 3,
  claimWindowDays: 30,
  maxOpenTests: 2,
};

/** Status, bei denen jemand ein Produkt bekommen hat */
const CLAIMED = ["accepted", "shipped", "received", "reviewed"] as const;
/** Status, bei denen der Test noch nicht abgeschlossen ist */
const OPEN = ["accepted", "shipped", "received"] as const;

type Executor = Pick<typeof db, "select">;
type Candidate = { id: string; email: string; first_name: string; address_key: string | null };

export async function getSettings(exec: Executor = db) {
  const [row] = await exec.select().from(schema.settings).where(eq(schema.settings.id, 1));
  return row ?? { id: 1, updatedAt: new Date(), ...DEFAULT_SETTINGS };
}

/**
 * Verteilt freie Plätze aller aktiven Produkte per Zufall.
 *
 * Regeln:
 * - nur aktive Tester mit bestätigter E-Mail-Adresse
 * - niemand bekommt dasselbe Produkt zweimal (auch nicht nach Stornierung oder Absage)
 * - pro Haushalt (gleiche Adresse) höchstens einmal dasselbe Produkt
 * - höchstens `maxOpenTests` offene Tests und `maxClaimsPerWindow` Produkte in `claimWindowDays` Tagen
 *
 * Läuft unter einer Datenbank-Sperre, damit parallele Aufrufe nichts doppelt vergeben.
 */
export async function distribute(onlyProductId?: string) {
  const assigned = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(4711)`);
    const settings = await getSettings(tx);
    const since = new Date(Date.now() - settings.claimWindowDays * 86_400_000);
    const today = todayBerlin();
    const a = schema.applications;
    const p = schema.products;

    const products = await tx
      .select({
        id: p.id,
        title: p.title,
        slug: p.slug,
        shortDescription: p.shortDescription,
        applicationDeadline: p.applicationDeadline,
        slots: p.slots,
        // Bewusst mit festen Tabellennamen: Drizzle lässt sie bei einer einzelnen Tabelle sonst weg
        taken: sql<number>`(select count(*) from applications x where x.product_id = "products"."id" and x.status in ('accepted','shipped','received','reviewed'))`.mapWith(
          Number,
        ),
      })
      .from(p)
      .where(
        and(
          eq(p.status, "active"),
          onlyProductId ? eq(p.id, onlyProductId) : undefined,
          sql`(${p.applicationDeadline} is null or ${p.applicationDeadline} >= ${today})`,
        ),
      )
      .orderBy(p.createdAt);

    const result: { testerId: string; email: string; firstName: string; productId: string }[] = [];

    for (const product of products) {
      const free = product.slots - product.taken;
      if (free <= 0) continue;

      const candidates = (await tx.execute(sql`
        select t.id, t.email, t.first_name, t.address_key
        from testers t
        where t.status = 'active'
          and t.email_verified_at is not null
          and not exists (select 1 from applications x where x.tester_id = t.id and x.product_id = ${product.id})
          and (
            t.address_key is null or not exists (
              select 1 from applications x join testers t2 on t2.id = x.tester_id
              where x.product_id = ${product.id}
                and x.status in ('accepted','shipped','received','reviewed')
                and t2.address_key = t.address_key
            )
          )
          and (select count(*) from applications x where x.tester_id = t.id
                 and x.status in ('accepted','shipped','received')) < ${settings.maxOpenTests}
          and (select count(*) from applications x where x.tester_id = t.id
                 and x.status in ('accepted','shipped','received','reviewed')
                 and x.decided_at >= ${since.toISOString()}) < ${settings.maxClaimsPerWindow}
        order by random()
        limit ${free * 3}
      `)) as unknown as Candidate[];

      const households = new Set<string>();
      const picked: Candidate[] = [];
      for (const c of candidates) {
        if (picked.length >= free) break;
        if (c.address_key && households.has(c.address_key)) continue;
        if (c.address_key) households.add(c.address_key);
        picked.push(c);
      }
      if (picked.length === 0) continue;

      const now = new Date();
      await tx
        .insert(a)
        .values(picked.map((c) => ({ productId: product.id, testerId: c.id, status: "accepted" as const, decidedAt: now })))
        .onConflictDoNothing();
      for (const c of picked) {
        result.push({ testerId: c.id, email: c.email, firstName: c.first_name, productId: product.id });
      }
    }
    return result;
  });

  // E-Mails erst nach erfolgreicher Transaktion – ohne Produktnamen, es soll ja eine Überraschung bleiben
  if (assigned.length > 0) {
    try {
      await sendBulkEmail(
        assigned.map((r) => ({ id: r.testerId, email: r.email, firstName: r.firstName })),
        (r) => assignedTemplate(r),
      );
    } catch (error) {
      console.error("E-Mails zur Auslosung konnten nicht verschickt werden", error);
    }
  }
  return { assigned: assigned.length };
}

/** Kontingent eines Testers für die Anzeige im Konto */
export async function getQuota(testerId: string) {
  const settings = await getSettings();
  const a = schema.applications;
  const since = new Date(Date.now() - settings.claimWindowDays * 86_400_000);
  const [[{ inWindow }], [{ open }]] = await Promise.all([
    db
      .select({ inWindow: count() })
      .from(a)
      .where(and(eq(a.testerId, testerId), inArray(a.status, [...CLAIMED]), gte(a.decidedAt, since))),
    db
      .select({ open: count() })
      .from(a)
      .where(and(eq(a.testerId, testerId), inArray(a.status, [...OPEN]))),
  ]);
  return { settings, inWindow, open };
}

/** Wie viele Plätze aktiver Produkte noch nicht vergeben werden konnten */
export async function getUnfilledSlots() {
  const p = schema.products;
  const [row] = await db
    .select({
      unfilled: sql<number>`coalesce(sum(greatest("products"."slots" - (select count(*) from applications x where x.product_id = "products"."id" and x.status in ('accepted','shipped','received','reviewed')), 0)), 0)`.mapWith(
        Number,
      ),
    })
    .from(p)
    .where(eq(p.status, "active"));
  return row?.unfilled ?? 0;
}
