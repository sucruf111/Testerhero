import "server-only";
import { and, arrayContains, asc, avg, count, desc, eq, getTableColumns, gte, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { ApplicationStatus, TesterStatus } from "@/lib/db/schema";

const { applications: a, products: p, testers: t, reviews: r } = schema;

/* ───────────── Dashboard ───────────── */

export async function getDashboardStats() {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [[testerStats], [appStats], [reviewStats], [productStats]] = await Promise.all([
    db
      .select({
        active: sql<number>`count(*) filter (where ${t.status} = 'active')`.mapWith(Number),
        unsubscribed: sql<number>`count(*) filter (where ${t.status} = 'unsubscribed')`.mapWith(Number),
        newLast30: sql<number>`count(*) filter (where ${t.createdAt} >= ${since.toISOString()})`.mapWith(Number),
        unverified: sql<number>`count(*) filter (where ${t.emailVerifiedAt} is null and ${t.status} = 'active')`.mapWith(Number),
      })
      .from(t),
    db
      .select({
        pending: sql<number>`count(*) filter (where ${a.status} = 'pending')`.mapWith(Number),
        accepted: sql<number>`count(*) filter (where ${a.status} = 'accepted')`.mapWith(Number),
        inTest: sql<number>`count(*) filter (where ${a.status} in ('shipped','received'))`.mapWith(Number),
      })
      .from(a),
    db.select({ total: count(), average: avg(r.rating) }).from(r),
    db.select({ active: sql<number>`count(*) filter (where ${p.status} = 'active')`.mapWith(Number) }).from(p),
  ]);
  return {
    testers: testerStats,
    applications: appStats,
    reviews: { total: reviewStats.total, average: reviewStats.average ? Number(reviewStats.average) : null },
    products: productStats,
  };
}

export async function getRecentApplications(limit = 8) {
  return db.query.applications.findMany({
    orderBy: desc(a.createdAt),
    limit,
    with: {
      tester: { columns: { id: true, firstName: true, lastName: true, city: true } },
      product: { columns: { id: true, title: true } },
    },
  });
}

/* ───────────── Produkte ───────────── */

const productAggregates = {
  takenSlots: sql<number>`count(distinct ${a.id}) filter (where ${a.status} in ('accepted','shipped','received','reviewed'))`.mapWith(Number),
  applicantCount: sql<number>`count(distinct ${a.id}) filter (where ${a.status} <> 'withdrawn')`.mapWith(Number),
  pendingCount: sql<number>`count(distinct ${a.id}) filter (where ${a.status} = 'pending')`.mapWith(Number),
  toShipCount: sql<number>`count(distinct ${a.id}) filter (where ${a.status} = 'accepted')`.mapWith(Number),
  reviewCount: sql<number>`(select count(*) from ${r} where ${r.productId} = ${p.id})`.mapWith(Number),
  avgRating: sql<number | null>`(select avg(${r.rating}) from ${r} where ${r.productId} = ${p.id})`.mapWith((v) =>
    v == null ? null : Number(v),
  ),
};

export async function getAdminProducts(status?: "draft" | "active" | "closed") {
  return db
    .select({ ...getTableColumns(p), ...productAggregates })
    .from(p)
    .leftJoin(a, eq(a.productId, p.id))
    .where(status ? eq(p.status, status) : undefined)
    .groupBy(p.id)
    .orderBy(sql`case ${p.status} when 'active' then 0 when 'draft' then 1 else 2 end`, desc(p.createdAt));
}

export async function getAdminProduct(id: string) {
  const [row] = await db
    .select({ ...getTableColumns(p), ...productAggregates })
    .from(p)
    .leftJoin(a, eq(a.productId, p.id))
    .where(eq(p.id, id))
    .groupBy(p.id);
  return row ?? null;
}

export async function getProductStatusCounts(productId: string) {
  const rows = await db
    .select({ status: a.status, n: count() })
    .from(a)
    .where(eq(a.productId, productId))
    .groupBy(a.status);
  return Object.fromEntries(rows.map((row) => [row.status, row.n])) as Partial<Record<ApplicationStatus, number>>;
}

export async function getProductApplications(productId: string, status?: ApplicationStatus) {
  const apps = await db.query.applications.findMany({
    where: and(eq(a.productId, productId), status ? eq(a.status, status) : undefined),
    with: { tester: true, review: { columns: { id: true, rating: true } } },
    orderBy: [sql`case ${a.status} when 'pending' then 0 when 'accepted' then 1 when 'shipped' then 2 when 'received' then 3 when 'reviewed' then 4 else 5 end`, asc(a.createdAt)],
  });
  // Bisherige Erfahrung der Bewerber:innen (abgeschlossene Tests & Bewertungen anderer Produkte)
  const testerIds = [...new Set(apps.map((x) => x.testerId))];
  const history = testerIds.length
    ? await db
        .select({
          testerId: a.testerId,
          tests: sql<number>`count(*) filter (where ${a.status} in ('shipped','received','reviewed'))`.mapWith(Number),
          reviews: sql<number>`count(*) filter (where ${a.status} = 'reviewed')`.mapWith(Number),
        })
        .from(a)
        .where(and(inArray(a.testerId, testerIds), sql`${a.productId} <> ${productId}`))
        .groupBy(a.testerId)
    : [];
  const byTester = new Map(history.map((h) => [h.testerId, h]));
  return apps.map((app) => ({ ...app, history: byTester.get(app.testerId) ?? { tests: 0, reviews: 0 } }));
}

/* ───────────── Versand ───────────── */

export async function getShippingQueue() {
  return db.query.applications.findMany({
    where: eq(a.status, "accepted"),
    with: { tester: true, product: { columns: { id: true, title: true } } },
    orderBy: [asc(a.productId), asc(a.decidedAt)],
  });
}

export async function getRecentlyShipped(limit = 15) {
  return db.query.applications.findMany({
    where: inArray(a.status, ["shipped", "received"]),
    with: {
      tester: { columns: { id: true, firstName: true, lastName: true, city: true } },
      product: { columns: { id: true, title: true } },
    },
    orderBy: desc(a.shippedAt),
    limit,
  });
}

/* ───────────── Tester ───────────── */

export type TesterFilter = { q?: string; status?: TesterStatus | "unverified"; interest?: string; page?: number };
export const TESTERS_PER_PAGE = 40;

function testerWhere({ q, status, interest }: TesterFilter): SQL | undefined {
  const conditions: (SQL | undefined)[] = [];
  if (q) {
    const pattern = `%${q.replace(/[%_]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(t.firstName, pattern),
        ilike(t.lastName, pattern),
        ilike(t.email, pattern),
        ilike(t.city, pattern),
        ilike(t.postalCode, `${q}%`),
        sql`(${t.firstName} || ' ' || ${t.lastName}) ilike ${pattern}`,
      ),
    );
  }
  if (status === "unverified") conditions.push(and(isNull(t.emailVerifiedAt), eq(t.status, "active")));
  else if (status) conditions.push(eq(t.status, status));
  if (interest) conditions.push(arrayContains(t.interests, [interest]));
  return and(...conditions);
}

export async function getTesters(filter: TesterFilter) {
  const page = Math.max(1, filter.page ?? 1);
  const where = testerWhere(filter);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        ...getTableColumns(t),
        applications: sql<number>`count(${a.id}) filter (where ${a.status} <> 'withdrawn')`.mapWith(Number),
        tests: sql<number>`count(${a.id}) filter (where ${a.status} in ('shipped','received','reviewed'))`.mapWith(Number),
        reviews: sql<number>`count(${a.id}) filter (where ${a.status} = 'reviewed')`.mapWith(Number),
      })
      .from(t)
      .leftJoin(a, eq(a.testerId, t.id))
      .where(where)
      .groupBy(t.id)
      .orderBy(desc(t.createdAt))
      .limit(TESTERS_PER_PAGE)
      .offset((page - 1) * TESTERS_PER_PAGE),
    db.select({ total: count() }).from(t).where(where),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / TESTERS_PER_PAGE)) };
}

export async function getTestersForExport(filter: TesterFilter) {
  return db.select().from(t).where(testerWhere(filter)).orderBy(asc(t.lastName), asc(t.firstName));
}

export async function getTesterDetail(id: string) {
  return db.query.testers.findFirst({
    where: eq(t.id, id),
    with: {
      applications: {
        with: { product: { columns: { id: true, title: true, slug: true } }, review: true },
        orderBy: desc(a.createdAt),
      },
    },
  });
}

/* ───────────── Bewertungen ───────────── */

export async function getReviewSummary() {
  return db
    .select({
      productId: p.id,
      title: p.title,
      total: count(r.id),
      average: sql<number | null>`avg(${r.rating})`.mapWith((v) => (v == null ? null : Number(v))),
      recommend: sql<number>`count(*) filter (where ${r.wouldRecommend})`.mapWith(Number),
    })
    .from(r)
    .innerJoin(p, eq(p.id, r.productId))
    .groupBy(p.id)
    .orderBy(desc(sql`max(${r.createdAt})`));
}

export async function getReviews(productId?: string, minDate?: Date) {
  return db.query.reviews.findMany({
    where: and(productId ? eq(r.productId, productId) : undefined, minDate ? gte(r.createdAt, minDate) : undefined),
    with: {
      tester: { columns: { id: true, firstName: true, lastName: true, city: true } },
      product: { columns: { id: true, title: true } },
    },
    orderBy: desc(r.createdAt),
  });
}
