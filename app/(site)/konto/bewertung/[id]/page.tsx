import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { requireTester } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Bewertung schreiben" };

export default async function ReviewPage({ params }: PageProps<"/konto/bewertung/[id]">) {
  const { id } = await params;
  const tester = await requireTester("/konto");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const app = await db.query.applications.findFirst({
    where: and(eq(schema.applications.id, id), eq(schema.applications.testerId, tester.id)),
    with: { product: true },
  });
  if (!app) notFound();
  // Bewerten erst nach dem Auspacken
  if (app.status !== "received") redirect("/konto");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/konto" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Zurück
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-line">
          <ProductImage src={app.product.imageUrl} alt={app.product.title} category={app.product.category} />
        </div>
        <div>
          <p className="text-sm text-muted">Deine Bewertung für</p>
          <h2 className="font-display text-xl font-bold">{app.product.title}</h2>
        </div>
      </div>

      {app.product.testInstructions && (
        <div className="mt-4 rounded-xl bg-cream p-4 text-sm leading-relaxed text-ink-soft">
          <p className="mb-1 font-semibold text-ink">Darauf kannst du achten:</p>
          <p className="whitespace-pre-line">{app.product.testInstructions}</p>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <ReviewForm applicationId={app.id} />
      </div>
    </div>
  );
}
