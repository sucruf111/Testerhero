import "server-only";
import { desc, eq, ne, and } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const { applications: a } = schema;

/** Pakete eines Testers (ohne freigegebene) */
export async function getTesterApplications(testerId: string) {
  return db.query.applications.findMany({
    where: and(eq(a.testerId, testerId), ne(a.status, "withdrawn")),
    with: { product: true, review: true },
    orderBy: desc(a.decidedAt),
  });
}
