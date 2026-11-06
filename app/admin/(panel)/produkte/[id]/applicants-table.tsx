import Link from "next/link";
import { Check, ExternalLink, MessageSquareQuote, PackageCheck, RotateCcw, Truck, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { compactInputClass } from "@/components/ui/form";
import { Avatar, Badge, Stars } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { bulkApplicationsAction, updateApplicationAction } from "@/lib/actions/admin";
import { cn } from "@/lib/cn";
import { APPLICATION_STATUS, CARRIERS, TESTER_STATUS } from "@/lib/constants";
import type { getProductApplications } from "@/lib/admin-queries";
import { formatDate } from "@/lib/format";
import { trackingUrl } from "@/lib/tracking";
import { SelectAll } from "./select-all";

type Apps = Awaited<ReturnType<typeof getProductApplications>>;

export function ApplicantsTable({ apps }: { apps: Apps }) {
  const currentYear = new Date().getFullYear();
  const selectable = apps.filter((a) => a.status !== "withdrawn");

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line/70">
      {/* Sammelaktionen */}
      <form id="bulk-form" action={bulkApplicationsAction} className="flex flex-wrap items-center gap-2 border-b border-line/70 bg-cream/60 px-4 py-3 sm:px-5">
        {selectable.length > 0 && <SelectAll formId="bulk-form" />}
        <span className="mr-auto text-sm text-muted">Für markierte Bewerbungen:</span>
        <SubmitButton name="status" value="accepted" size="sm" variant="dark">
          <Check /> Auswählen
        </SubmitButton>
        <SubmitButton name="status" value="rejected" size="sm" variant="secondary" confirm="Markierte Bewerbungen ablehnen? Die Tester erhalten eine Absage per E-Mail.">
          <X /> Ablehnen
        </SubmitButton>
        <SubmitButton name="status" value="shipped" size="sm" variant="secondary">
          <Truck /> Als versendet markieren
        </SubmitButton>
      </form>

      <ul className="divide-y divide-line/60">
        {apps.map((app) => {
          const t = app.tester;
          const name = `${t.firstName} ${t.lastName}`;
          const s = APPLICATION_STATUS[app.status];
          const testerInactive = t.status !== "active";
          return (
            <li
              key={app.id}
              className={cn(
                "grid gap-4 px-4 py-4 sm:px-5 xl:grid-cols-[1.25rem_14rem_minmax(0,1fr)_24.5rem] xl:items-start",
                app.status === "withdrawn" && "opacity-55",
              )}
            >
              <div className="flex items-start gap-3 xl:contents">
                <div className="pt-2">
                  {app.status !== "withdrawn" && (
                    <input
                      type="checkbox"
                      name="ids"
                      value={app.id}
                      form="bulk-form"
                      aria-label={`${name} markieren`}
                      className="checkbox-check size-5 cursor-pointer rounded-md bg-white ring-1 ring-line checked:bg-coral-500 checked:ring-coral-500"
                    />
                  )}
                </div>

                {/* Person */}
                <div className="flex min-w-0 flex-1 gap-3">
                  <Avatar name={name} />
                  <div className="min-w-0">
                    <Link href={`/admin/tester/${t.id}`} className="font-semibold hover:text-coral-600">
                      {name}
                    </Link>
                    <p className="text-sm text-muted">
                      {t.postalCode} {t.city}
                      {t.birthYear ? ` · ${currentYear - t.birthYear} J.` : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {app.history.tests > 0 ? (
                        <Badge tone="violet" dot={false}>
                          {app.history.tests} Tests · {app.history.reviews} bewertet
                        </Badge>
                      ) : (
                        <Badge tone="slate" dot={false}>
                          Erster Test
                        </Badge>
                      )}
                      {!t.emailVerifiedAt && <Badge tone="amber" dot={false}>E-Mail unbestätigt</Badge>}
                      {testerInactive && <Badge tone={TESTER_STATUS[t.status].tone}>{TESTER_STATUS[t.status].label}</Badge>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivation */}
              <div className="min-w-0 text-sm text-ink-soft xl:pt-0.5">
                {app.motivation ? (
                  <details className="group">
                    <summary className="flex cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden">
                      <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-coral-400" />
                      <span className="line-clamp-2 group-open:line-clamp-none">{app.motivation}</span>
                    </summary>
                  </details>
                ) : (
                  <span className="text-muted/70 italic">Keine Nachricht</span>
                )}
                <p className="mt-1.5 text-xs text-muted">Beworben am {formatDate(app.createdAt)}</p>
              </div>

              {/* Status & Aktionen */}
              <div className="flex flex-col items-start gap-2.5 xl:items-end">
                <Badge tone={s.tone}>{s.label}</Badge>
                <RowActions app={app} disabled={testerInactive} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RowActions({ app, disabled }: { app: Apps[number]; disabled: boolean }) {
  const hidden = <input type="hidden" name="applicationId" value={app.id} />;

  switch (app.status) {
    case "pending":
      return (
        <div className="flex gap-2">
          <form action={updateApplicationAction}>
            {hidden}
            <input type="hidden" name="status" value="rejected" />
            <SubmitButton variant="ghost" size="sm">
              Ablehnen
            </SubmitButton>
          </form>
          <form action={updateApplicationAction}>
            {hidden}
            <input type="hidden" name="status" value="accepted" />
            <SubmitButton size="sm" disabled={disabled}>
              <Check /> Auswählen
            </SubmitButton>
          </form>
        </div>
      );
    case "accepted":
      return (
        <div className="flex flex-col gap-2 xl:items-end">
          <form action={updateApplicationAction} className="flex flex-wrap gap-2 xl:justify-end">
            {hidden}
            <input type="hidden" name="status" value="shipped" />
            <select name="carrier" defaultValue="DHL" className={cn(compactInputClass, "select-chevron w-28 pr-8")} aria-label="Versanddienstleister">
              <option value="">–</option>
              {CARRIERS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input name="trackingNumber" placeholder="Sendungsnummer" aria-label="Sendungsnummer" className={cn(compactInputClass, "w-36")} />
            <SubmitButton size="sm" variant="dark" disabled={disabled}>
              <Truck /> Versendet
            </SubmitButton>
          </form>
          <form action={updateApplicationAction}>
            {hidden}
            <input type="hidden" name="status" value="pending" />
            <SubmitButton variant="ghost" size="sm" className="h-7 text-xs">
              <RotateCcw /> Auswahl zurücknehmen
            </SubmitButton>
          </form>
        </div>
      );
    case "shipped": {
      const url = trackingUrl(app.carrier, app.trackingNumber);
      return (
        <div className="flex flex-col gap-2 text-sm xl:items-end">
          <p className="text-muted">
            {formatDate(app.shippedAt)}
            {app.carrier && ` · ${app.carrier}`}
            {app.trackingNumber &&
              (url ? (
                <a href={url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-1 font-semibold text-coral-600 hover:underline">
                  {app.trackingNumber} <ExternalLink className="size-3" />
                </a>
              ) : (
                <span className="ml-1 font-mono">{app.trackingNumber}</span>
              ))}
          </p>
          <form action={updateApplicationAction}>
            {hidden}
            <input type="hidden" name="status" value="received" />
            <SubmitButton variant="ghost" size="sm" className="h-7 text-xs">
              <PackageCheck /> Als erhalten markieren
            </SubmitButton>
          </form>
        </div>
      );
    }
    case "received":
      return <p className="text-sm text-muted">Erhalten am {formatDate(app.receivedAt)} – Bewertung ausstehend</p>;
    case "reviewed":
      return (
        <Link href="?tab=bewertungen" className={buttonClass("secondary", "sm")}>
          {app.review && <Stars value={app.review.rating} size="sm" />} Bewertung ansehen
        </Link>
      );
    case "rejected":
      return (
        <form action={updateApplicationAction}>
          {hidden}
          <input type="hidden" name="status" value="accepted" />
          <SubmitButton variant="ghost" size="sm" disabled={disabled}>
            Doch auswählen
          </SubmitButton>
        </form>
      );
    default:
      return <p className="text-sm text-muted">Vom Tester zurückgezogen</p>;
  }
}
