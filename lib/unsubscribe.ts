import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * mode "emails": nur Benachrichtigungen zu neuen Produkten abbestellen
 * mode "all":    komplett abmelden – keine Produkte, keine E-Mails, offene Bewerbungen zurückziehen
 */
export async function unsubscribeTester(testerId: string, mode: "emails" | "all") {
  if (mode === "emails") {
    await db.update(schema.testers).set({ notifyNewProducts: false }).where(eq(schema.testers.id, testerId));
    return;
  }
  await db.transaction(async (tx) => {
    await tx
      .update(schema.testers)
      .set({ status: "unsubscribed", unsubscribedAt: new Date(), notifyNewProducts: false })
      .where(and(eq(schema.testers.id, testerId), eq(schema.testers.status, "active")));
    // Offene Bewerbungen und noch nicht versendete Zusagen zurückziehen
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
