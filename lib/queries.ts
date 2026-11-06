import "server-only";
import { and, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const { applications: a, products: p } = schema;

/** Zählt vergebene Plätze und Bewerbungen je Produkt */
const productCounts = {
  takenSlots: sql<number>`count(${a.id}) filter (where ${a.status} in ('accepted','shipped','received','reviewed'))`
    .mapWith(Number)
    .as("taken_slots"),
  applicantCount: sql<number>`count(${a.id}) filter (where ${a.status} <> 'withdrawn')`
    .mapWith(Number)
    .as("applicant_count"),
};

export type ProductWithCounts = typeof p.$inferSelect & { takenSlots: number; applicantCount: number };

export async function getOpenProducts(limit?: number): Promise<ProductWithCounts[]> {
  const query = db
    .select({ ...getTableColumns(p), ...productCounts })
    .from(p)
    .leftJoin(a, eq(a.productId, p.id))
    .where(
      and(
        eq(p.status, "active"),
        sql`(${p.applicationDeadline} is null or ${p.applicationDeadline} >= (now() at time zone 'Europe/Berlin')::date)`,
      ),
    )
    .groupBy(p.id)
    .orderBy(sql`${p.applicationDeadline} asc nulls last`, desc(p.createdAt));
  return limit ? query.limit(limit) : query;
}

export async function getProductBySlug(slug: string): Promise<ProductWithCounts | null> {
  const [row] = await db
    .select({ ...getTableColumns(p), ...productCounts })
    .from(p)
    .leftJoin(a, eq(a.productId, p.id))
    .where(eq(p.slug, slug))
    .groupBy(p.id);
  return row ?? null;
}

export async function getProductWithCountsById(id: string): Promise<ProductWithCounts | null> {
  const [row] = await db
    .select({ ...getTableColumns(p), ...productCounts })
    .from(p)
    .leftJoin(a, eq(a.productId, p.id))
    .where(eq(p.id, id))
    .groupBy(p.id);
  return row ?? null;
}

export async function getApplicationFor(productId: string, testerId: string) {
  return db.query.applications.findFirst({
    where: and(eq(a.productId, productId), eq(a.testerId, testerId)),
  });
}

export async function getTesterApplications(testerId: string) {
  return db.query.applications.findMany({
    where: eq(a.testerId, testerId),
    with: { product: true, review: true },
    orderBy: desc(a.updatedAt),
  });
}
