import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: { default: "Agentur-Bereich", template: "%s · TesterHero Admin" },
  robots: { index: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [[pending], [toShip]] = await Promise.all([
    db.select({ n: count() }).from(schema.applications).where(eq(schema.applications.status, "pending")),
    db.select({ n: count() }).from(schema.applications).where(eq(schema.applications.status, "accepted")),
  ]);

  return (
    <div className="min-h-dvh bg-[#f7f5f1] lg:grid lg:grid-cols-[17rem_1fr]">
      <AdminNav email={admin.email} badges={{ produkte: pending.n, versand: toShip.n }} />
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
