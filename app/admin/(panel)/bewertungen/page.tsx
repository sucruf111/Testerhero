import type { Metadata } from "next";
import Link from "next/link";
import { Download, Star } from "lucide-react";
import { PageHeader, td, th } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { EmptyState, Stars } from "@/components/ui/misc";
import { getReviewSummary, getReviews } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { ReviewCard } from "./review-card";

export const metadata: Metadata = { title: "Bewertungen" };

export default async function AdminReviewsPage({ searchParams }: PageProps<"/admin/bewertungen">) {
  await requireAdmin();
  const { produkt } = await searchParams;
  const summary = await getReviewSummary();
  const productId = typeof produkt === "string" && summary.some((s) => s.productId === produkt) ? produkt : undefined;
  const reviews = await getReviews(productId);

  return (
    <div>
      <PageHeader
        title="Bewertungen"
        description="Alle Rückmeldungen eurer Tester – intern, ungeschönt und exportierbar."
        actions={
          reviews.length > 0 && (
            <a href={`/admin/export/bewertungen${productId ? `?produkt=${productId}` : ""}`} className={buttonClass("secondary", "sm")}>
              <Download /> CSV exportieren
            </a>
          )
        }
      />

      {summary.length === 0 ? (
        <EmptyState icon={<Star />} title="Noch keine Bewertungen">
          Sobald Tester ihre Produkte bewertet haben, findest du hier alle Rückmeldungen.
        </EmptyState>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[22rem_1fr]">
          <aside className="xl:sticky xl:top-8 xl:self-start">
            <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line/70">
              <table className="w-full">
                <thead className="border-b border-line/70 bg-cream/60">
                  <tr>
                    <th className={th}>Produkt</th>
                    <th className={cn(th, "text-right")}>Ø</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  <tr className={cn(!productId && "bg-coral-50/60")}>
                    <td className={td} colSpan={2}>
                      <Link href="/admin/bewertungen" className="font-semibold hover:text-coral-600">
                        Alle Produkte
                      </Link>
                    </td>
                  </tr>
                  {summary.map((s) => (
                    <tr key={s.productId} className={cn(productId === s.productId && "bg-coral-50/60")}>
                      <td className={td}>
                        <Link href={`/admin/bewertungen?produkt=${s.productId}`} className="font-semibold hover:text-coral-600">
                          {s.title}
                        </Link>
                        <p className="text-xs text-muted">
                          {s.total} Bewertungen · {Math.round((s.recommend / Math.max(1, s.total)) * 100)} % Empfehlung
                        </p>
                      </td>
                      <td className={cn(td, "text-right")}>
                        <span className="font-display text-lg font-semibold">{s.average?.toLocaleString("de-DE", { maximumFractionDigits: 1 })}</span>
                        <div>
                          <Stars value={s.average ?? 0} size="sm" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </aside>

          <div className="grid content-start gap-4 lg:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
