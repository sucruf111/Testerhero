"use client";

import { useActionState, useState } from "react";
import { Send, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { submitReviewAction } from "@/lib/actions/tester";
import { Alert, Field, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import type { FormState } from "@/lib/validation";

const ratingLabels = ["", "Schlecht", "Geht so", "Okay", "Gut", "Sehr gut"];

export function ReviewForm({ applicationId }: { applicationId: string }) {
  const [state, action] = useActionState<FormState, FormData>(submitReviewAction, {});
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  const [rating, setRating] = useState(Number(v.rating) || 0);
  const [hover, setHover] = useState(0);
  const [bodyLength, setBodyLength] = useState(String(v.body ?? "").length);
  const shown = hover || rating;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="rating" value={rating || ""} />
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <fieldset>
        <legend className="text-[13px] font-semibold">Wie gefällt dir das Produkt insgesamt?</legend>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Sterne-Bewertung">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={rating === i}
                aria-label={`${i} ${i === 1 ? "Stern" : "Sterne"}`}
                onClick={() => setRating(i)}
                onMouseEnter={() => setHover(i)}
                className="rounded-lg p-0.5 transition hover:scale-110"
              >
                <Star
                  className={cn("size-8 transition", i <= shown ? "text-sun-400" : "text-line")}
                  fill="currentColor"
                  strokeWidth={0}
                />
              </button>
            ))}
          </div>
          <span className="text-sm font-semibold text-ink-soft">{ratingLabels[shown]}</span>
        </div>
        {e.rating && <p className="mt-2 text-sm text-red-600">{e.rating[0]}</p>}
      </fieldset>

      <Field label="Überschrift" name="title" error={e.title}>
        <Input name="title" required maxLength={120} placeholder="Deine Meinung in einem Satz" defaultValue={String(v.title ?? "")} error={e.title} />
      </Field>

      <Field
        label="Deine Erfahrung"
        name="body"
        error={e.body}
        hint={
          <span className={cn(bodyLength >= 80 ? "text-emerald-700" : "text-muted")}>
            {bodyLength >= 80 ? "Passt, danke!" : `Noch ${80 - bodyLength} Zeichen. Wie hast du das Produkt benutzt? Was ist dir aufgefallen?`}
          </span>
        }
      >
        <Textarea
          name="body"
          rows={7}
          required
          maxLength={5000}
          defaultValue={String(v.body ?? "")}
          onChange={(ev) => setBodyLength(ev.target.value.trim().length)}
          error={e.body}
          
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={<span className="inline-flex items-center gap-1.5"><ThumbsUp className="size-4 text-emerald-600" /> Gut fand ich</span>} name="pros" optional error={e.pros}>
          <Textarea name="pros" rows={3} defaultValue={String(v.pros ?? "")} />
        </Field>
        <Field label={<span className="inline-flex items-center gap-1.5"><ThumbsDown className="size-4 text-coral-600" /> Weniger gut fand ich</span>} name="cons" optional error={e.cons}>
          <Textarea name="cons" rows={3} defaultValue={String(v.cons ?? "")} />
        </Field>
      </div>

      <fieldset>
        <legend className="text-[13px] font-semibold">Würdest du das Produkt weiterempfehlen?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:max-w-xs">
          {[
            { value: "yes", label: "Ja" },
            { value: "no", label: "Nein" },
          ].map((o) => (
            <label key={o.value} className="cursor-pointer">
              <input type="radio" name="wouldRecommend" value={o.value} defaultChecked={v.wouldRecommend === o.value} className="peer sr-only" />
              <span className="block rounded-xl border border-line bg-white px-4 py-2 text-center text-sm font-semibold text-ink-soft transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-coral-500 hover:border-ink/30">
                {o.label}
              </span>
            </label>
          ))}
        </div>
        {e.wouldRecommend && <p className="mt-2 text-sm text-red-600">{e.wouldRecommend[0]}</p>}
      </fieldset>

      <SubmitButton size="lg" className="w-full" pendingText="Einen Moment …">
        <Send /> Bewertung abschicken
      </SubmitButton>
      <p className="text-center text-xs text-muted">Deine Bewertung wird nicht veröffentlicht. Sie geht nur an den Hersteller.</p>
    </form>
  );
}
