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
  if (app.status === "reviewed") redirect("/konto");
  if (app.status !== "shipped" && app.status !== "received") redirect("/konto");

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/konto" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Zurück zu meinen Tests
      </Link>

      <div className="mt-6 flex items-center gap-5 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-line/70">
        <div className="size-20 shrink-0 overflow-hidden rounded-2xl">
          <ProductImage src={app.product.imageUrl} alt={app.product.title} category={app.product.category} />
        </div>
        <div>
          <p className="text-sm font-semibold text-coral-600">Deine Bewertung für</p>
          <h2 className="font-display text-2xl font-semibold">{app.product.title}</h2>
        </div>
      </div>

      {app.product.testInstructions && (
        <div className="mt-5 rounded-3xl bg-lilac-50 p-5 text-[15px] leading-relaxed text-ink-soft ring-1 ring-lilac-100">
          <p className="mb-1 font-semibold text-ink">Darauf kommt es an:</p>
          <p className="whitespace-pre-line">{app.product.testInstructions}</p>
        </div>
      )}

      <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-lift ring-1 ring-line/70 sm:p-9">
        <ReviewForm applicationId={app.id} />
      </div>
    </div>
  );
}
