import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: { default: "Agentur", template: "%s · TesterHero Agentur" },
  robots: { index: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [toShip] = await db.select({ n: count() }).from(schema.applications).where(eq(schema.applications.status, "accepted"));

  return (
    <div className="min-h-dvh bg-cream lg:grid lg:grid-cols-[14.5rem_1fr]">
      <AdminNav email={admin.email} badges={{ versand: toShip.n }} />
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
