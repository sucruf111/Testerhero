import Link from "next/link";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Avatar, Badge, Stars } from "@/components/ui/misc";
import type { getReviews } from "@/lib/admin-queries";
import { formatDate } from "@/lib/format";

type ReviewWithRelations = Awaited<ReturnType<typeof getReviews>>[number];

export function ReviewCard({ review, showProduct = true }: { review: ReviewWithRelations; showProduct?: boolean }) {
  const name = `${review.tester.firstName} ${review.tester.lastName}`;
  return (
    <article className="flex flex-col rounded-xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <Stars value={review.rating} />
        {review.wouldRecommend ? (
          <Badge tone="green" dot={false}>
            <ThumbsUp className="size-3" /> Empfiehlt es
          </Badge>
        ) : (
          <Badge tone="slate" dot={false}>
            <ThumbsDown className="size-3" /> Empfiehlt es nicht
          </Badge>
        )}
      </div>
      {showProduct && (
        <Link href={`/admin/produkte/${review.product.id}?tab=bewertungen`} className="mt-2 text-xs font-semibold text-coral-600 hover:text-coral-700">
          {review.product.title}
        </Link>
      )}
      <h3 className="mt-1.5 font-semibold">„{review.title}“</h3>
      <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink-soft">{review.body}</p>

      {(review.pros || review.cons) && (
        <div className="mt-3 grid gap-2">
          {review.pros && (
            <div className="rounded-lg bg-emerald-50/70 p-2.5 text-sm">
              <p className="mb-1 flex items-center gap-1.5 font-semibold text-emerald-800">
                <ThumbsUp className="size-3.5" /> Gut
              </p>
              <p className="whitespace-pre-line text-ink-soft">{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div className="rounded-lg bg-coral-50 p-2.5 text-sm">
              <p className="mb-1 flex items-center gap-1.5 font-semibold text-coral-700">
                <ThumbsDown className="size-3.5" /> Weniger gut
              </p>
              <p className="whitespace-pre-line text-ink-soft">{review.cons}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-3">
        <Avatar name={name} className="size-6 text-[10px]" />
        <div className="text-[13px]">
          <Link href={`/admin/tester/${review.tester.id}`} className="font-semibold hover:text-coral-600">
            {name}
          </Link>
          <span className="text-muted">
            {" "}
            · {review.tester.city} · {formatDate(review.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}
