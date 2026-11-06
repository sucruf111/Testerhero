import Link from "next/link";
import { ExternalLink, PackageCheck, Truck, X } from "lucide-react";
import { compactInputClass } from "@/components/ui/form";
import { Badge, Stars } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { bulkApplicationsAction, updateApplicationAction } from "@/lib/actions/admin";
import type { getProductApplications } from "@/lib/admin-queries";
import { cn } from "@/lib/cn";
import { APPLICATION_STATUS, CARRIERS, TESTER_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { trackingUrl } from "@/lib/tracking";
import { SelectAll } from "./select-all";

type Apps = Awaited<ReturnType<typeof getProductApplications>>;

export function ApplicantsTable({ apps }: { apps: Apps }) {
  const selectable = apps.some((a) => a.status === "accepted" || a.status === "shipped");

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      {selectable && (
        <form id="bulk-form" action={bulkApplicationsAction} className="flex flex-wrap items-center gap-2 border-b border-line bg-cream/60 px-3 py-2">
          <SelectAll formId="bulk-form" />
          <span className="mr-auto text-[13px] text-muted">Markierte:</span>
          <SubmitButton name="status" value="shipped" size="sm" variant="dark">
            <Truck /> Versendet
          </SubmitButton>
          <SubmitButton
            name="status"
            value="rejected"
            size="sm"
            variant="secondary"
            confirm="Markierte Pakete stornieren? Die Plätze werden neu ausgelost."
          >
            <X /> Stornieren
          </SubmitButton>
        </form>
      )}

      <ul className="divide-y divide-line">
        {apps.map((app) => {
          const t = app.tester;
          const name = `${t.firstName} ${t.lastName}`;
          const s = APPLICATION_STATUS[app.status];
          const inactive = t.status !== "active";
          const canSelect = app.status === "accepted" || app.status === "shipped";
          return (
            <li
              key={app.id}
              className={cn(
                "flex flex-col gap-2 px-3 py-2.5 lg:flex-row lg:items-center lg:gap-4",
                (app.status === "withdrawn" || app.status === "rejected") && "opacity-55",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="w-5 shrink-0">
                  {canSelect && (
                    <input
                      type="checkbox"
                      name="ids"
                      value={app.id}
                      form="bulk-form"
                      aria-label={`${name} markieren`}
                      className="checkbox-check size-[18px] cursor-pointer rounded-[5px] border border-ink/25 bg-white checked:border-coral-500 checked:bg-coral-500"
                    />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    <Link href={`/admin/tester/${t.id}`} className="font-semibold hover:text-coral-600">
                      {name}
                    </Link>
                    <span className="text-muted">
                      {" "}
                      · {t.postalCode} {t.city}
                    </span>
                  </p>
                  <p className="text-xs text-muted">Ausgelost am {formatDate(app.decidedAt ?? app.createdAt)}</p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0">
                  <Badge tone={s.tone}>{s.label}</Badge>
                  {inactive && <Badge tone={TESTER_STATUS[t.status].tone}>{TESTER_STATUS[t.status].label}</Badge>}
                </div>
              </div>
              <div className="pl-8 lg:w-[25rem] lg:pl-0">
                <RowActions app={app} disabled={inactive} />
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
    case "accepted":
      return (
        <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
          <form action={updateApplicationAction} className="flex flex-wrap gap-1.5">
            {hidden}
            <input type="hidden" name="status" value="shipped" />
            <select name="carrier" defaultValue="DHL" className={cn(compactInputClass, "select-chevron w-24 pr-7")} aria-label="Versanddienstleister">
              <option value="">–</option>
              {CARRIERS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input name="trackingNumber" placeholder="Sendungsnr." aria-label="Sendungsnummer" className={cn(compactInputClass, "w-32")} />
            <SubmitButton size="sm" variant="dark" disabled={disabled}>
              <Truck /> Versendet
            </SubmitButton>
          </form>
          <form action={updateApplicationAction}>
            {hidden}
            <input type="hidden" name="status" value="rejected" />
            <SubmitButton variant="ghost" size="sm" className="px-2 text-muted" confirm="Paket stornieren? Der Platz wird neu ausgelost." aria-label="Stornieren" title="Stornieren">
              <X />
            </SubmitButton>
          </form>
        </div>
      );
    case "shipped": {
      const url = trackingUrl(app.carrier, app.trackingNumber);
      return (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted lg:justify-end">
          <span>
            {formatDate(app.shippedAt)}
            {app.carrier && ` · ${app.carrier}`}
            {app.trackingNumber &&
              (url ? (
                <a href={url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-0.5 font-semibold text-coral-600 hover:underline">
                  {app.trackingNumber} <ExternalLink className="size-3" />
                </a>
              ) : (
                <span className="ml-1 font-mono">{app.trackingNumber}</span>
              ))}
          </span>
          <form action={updateApplicationAction}>
            {hidden}
            <input type="hidden" name="status" value="received" />
            <SubmitButton variant="ghost" size="sm">
              <PackageCheck /> Angekommen
            </SubmitButton>
          </form>
        </div>
      );
    }
    case "received":
      return <p className="text-[13px] text-muted lg:text-right">Ausgepackt am {formatDate(app.receivedAt)}, Bewertung fehlt noch</p>;
    case "reviewed":
      return (
        <Link href="?tab=bewertungen" className="flex items-center gap-1.5 text-[13px] font-semibold hover:text-coral-600 lg:justify-end">
          {app.review && <Stars value={app.review.rating} size="sm" />} Bewertung ansehen
        </Link>
      );
    case "rejected":
      return <p className="text-[13px] text-muted lg:text-right">Von euch storniert</p>;
    case "withdrawn":
      return <p className="text-[13px] text-muted lg:text-right">Vom Tester abgelehnt</p>;
    default:
      return null;
  }
}
