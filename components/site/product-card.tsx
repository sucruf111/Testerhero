import Link from "next/link";
import { ArrowUpRight, CalendarClock, Users } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { deadlineLabel, formatEuro } from "@/lib/format";
import type { ProductWithCounts } from "@/lib/queries";

export function ProductCard({ product }: { product: ProductWithCounts }) {
  const remaining = Math.max(0, product.slots - product.takenSlots);
  const deadline = deadlineLabel(product.applicationDeadline);
  const price = formatEuro(product.retailPriceCents);

  return (
    <Link
      href={`/produkte/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-soft ring-1 ring-line/70 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ProductImage
          src={product.imageUrl}
          alt={product.title}
          category={product.category}
          className="transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink shadow-soft backdrop-blur">
            {product.category}
          </span>
        </div>
        {price && (
          <span className="absolute top-3 right-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            Wert {price}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {product.brand && <p className="text-xs font-semibold tracking-wider text-coral-600 uppercase">{product.brand}</p>}
        <h3 className="mt-1 font-display text-xl leading-snug font-semibold text-ink">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-muted">{product.shortDescription}</p>

        <div className="mt-auto pt-5">
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-gradient-to-r from-coral-500 to-sun-400"
              style={{ width: `${Math.min(100, (product.takenSlots / Math.max(1, product.slots)) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-ink-soft">
              <Users className="size-4 text-coral-500" />
              {remaining > 0 ? `${remaining} von ${product.slots} Plätzen frei` : "Alle Plätze vergeben"}
            </span>
            {deadline ? (
              <span className="inline-flex items-center gap-1.5 text-muted">
                <CalendarClock className="size-4" />
                {deadline}
              </span>
            ) : (
              <ArrowUpRight className="size-5 text-muted transition group-hover:text-coral-500" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
