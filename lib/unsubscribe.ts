import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Abmelden: keine Pakete und keine E-Mails mehr.
 * Reservierte, noch nicht verschickte Pakete werden freigegeben und neu ausgelost.
 */
export async function unsubscribeTester(testerId: string) {
  await db.transaction(async (tx) => {
    await tx
      .update(schema.testers)
      .set({ status: "unsubscribed", unsubscribedAt: new Date(), notifyNewProducts: false })
      .where(and(eq(schema.testers.id, testerId), eq(schema.testers.status, "active")));
    await tx
      .update(schema.applications)
      .set({ status: "withdrawn" })
      .where(
        and(
          eq(schema.applications.testerId, testerId),
          inArray(schema.applications.status, ["pending", "accepted"]),
        ),
      );
  });
}
