import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Gift, PackageCheck, PenLine, Truck, Undo2 } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { buttonClass } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { Stars } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { confirmReceivedAction, reactivateAction, withdrawApplicationAction } from "@/lib/actions/tester";
import { requireTester } from "@/lib/auth/session";
import { getQuota } from "@/lib/claims";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { getTesterApplications } from "@/lib/queries";
import { trackingUrl } from "@/lib/tracking";
import { ResendVerification } from "./resend-verification";

export const metadata: Metadata = { title: "Meine Pakete" };

export default async function KontoPage({ searchParams }: PageProps<"/konto">) {
  const tester = await requireTester("/konto");
  const [apps, quota, params] = await Promise.all([getTesterApplications(tester.id), getQuota(tester.id), searchParams]);
  const visible = apps.filter((a) => a.status !== "rejected" && a.status !== "pending");

  return (
    <div className="space-y-6">
      {params.willkommen && (
        <Alert tone="success" title="Schön, dass du dabei bist.">
          Wir haben dir eine E-Mail geschickt. Bitte bestätige deine Adresse, erst dann kannst du ausgelost werden.
        </Alert>
      )}
      {params.bewertet && <Alert tone="success">Danke für deine Bewertung!</Alert>}
      {params.passwort && <Alert tone="success">Dein neues Passwort ist gespeichert.</Alert>}
      {params.reaktiviert && <Alert tone="success">Du bist wieder dabei.</Alert>}

      {tester.status === "active" && !tester.emailVerifiedAt && <ResendVerification email={tester.email} />}

      {tester.status === "unsubscribed" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-cream p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-soft">Du bist abgemeldet und bekommst gerade keine Pakete. Willst du wieder mitmachen?</p>
          <form action={reactivateAction}>
            <SubmitButton size="sm">Wieder mitmachen</SubmitButton>
          </form>
        </div>
      )}
      {tester.status === "blocked" && (
        <Alert tone="error">Dein Konto ist gesperrt. Wenn du Fragen hast, antworte einfach auf eine unserer E-Mails.</Alert>
      )}

      {tester.status === "active" && tester.emailVerifiedAt && (
        <div className="rounded-2xl border border-line bg-cream/70 p-4 text-sm text-ink-soft">
          <p>
            <span className="font-semibold text-ink">Du bist dabei.</span> Sobald du für ein Produkt ausgelost wirst, bekommst du eine E-Mail.
          </p>
          <p className="mt-1 text-muted">
            In den letzten {quota.settings.claimWindowDays} Tagen: {quota.inWindow} von höchstens {quota.settings.maxClaimsPerWindow}{" "}
            Paketen. Offen: {quota.open} von höchstens {quota.settings.maxOpenTests}.
          </p>
        </div>
      )}

      <section>
        <h2 className="font-display text-xl font-bold">Meine Pakete</h2>
        {visible.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-line px-5 py-8 text-center">
            <Gift className="mx-auto size-6 text-coral-500" />
            <p className="mt-2 font-semibold">Noch kein Paket</p>
            <p className="mt-1 text-sm text-muted">Sobald du ausgelost wirst, siehst du dein Paket hier.</p>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {visible.map((app) => (
              <PackageRow key={app.id} app={app} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

type App = Awaited<ReturnType<typeof getTesterApplications>>[number];

function PackageRow({ app }: { app: App }) {
  // Das Produkt bleibt verdeckt, bis der Tester das Paket ausgepackt hat
  const revealed = app.status === "received" || app.status === "reviewed";
  const track = trackingUrl(app.carrier, app.trackingNumber);

  const state = {
    accepted: { label: "Ausgelost", text: "Wir packen gerade dein Paket.", icon: Gift },
    shipped: { label: "Unterwegs", text: `Verschickt am ${formatDate(app.shippedAt)}.`, icon: Truck },
    received: { label: "Ausgepackt", text: "Viel Spaß beim Testen.", icon: PackageCheck },
    reviewed: { label: "Bewertet", text: "Danke für deine Bewertung.", icon: PenLine },
  }[app.status as "accepted" | "shipped" | "received" | "reviewed"];
  if (!state) return null;

  return (
    <li className={cn("rounded-2xl border bg-white p-4", app.status === "received" ? "border-coral-300" : "border-line")}>
      <div className="flex gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-line sm:size-20">
          {revealed ? (
            <ProductImage src={app.product.imageUrl} alt={app.product.title} category={app.product.category} />
          ) : (
            <div className="grid h-full w-full place-items-center bg-coral-500 text-white">
              <Gift className="size-7" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-semibold">{revealed ? app.product.title : "Überraschungspaket"}</p>
            <span className="rounded-md bg-sand px-1.5 py-0.5 text-xs font-semibold text-ink-soft">{state.label}</span>
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {state.text}
            {app.status === "shipped" && app.trackingNumber && (
              <>
                {" "}
                {app.carrier ? `${app.carrier}, ` : ""}Sendungsnummer{" "}
                {track ? (
                  <a href={track} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-coral-600 hover:underline">
                    {app.trackingNumber} <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="font-mono">{app.trackingNumber}</span>
                )}
              </>
            )}
          </p>
          {revealed && app.product.shortDescription && app.status === "received" && (
            <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{app.product.shortDescription}</p>
          )}
          {app.review && (
            <p className="mt-1.5 flex items-center gap-2 text-sm">
              <Stars value={app.review.rating} size="sm" /> <span className="truncate text-ink-soft">„{app.review.title}“</span>
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {app.status === "shipped" && (
              <form action={confirmReceivedAction}>
                <input type="hidden" name="applicationId" value={app.id} />
                <SubmitButton size="sm">
                  <PackageCheck /> Paket ist da, auspacken
                </SubmitButton>
              </form>
            )}
            {app.status === "received" && (
              <Link href={`/konto/bewertung/${app.id}`} className={buttonClass("primary", "sm")}>
                <PenLine /> Jetzt bewerten
              </Link>
            )}
            {app.status === "accepted" && (
              <form action={withdrawApplicationAction}>
                <input type="hidden" name="applicationId" value={app.id} />
                <SubmitButton
                  variant="ghost"
                  size="sm"
                  className="-ml-2 text-muted"
                  confirm="Willst du dieses Paket wirklich nicht? Es geht dann an jemand anderen."
                >
                  <Undo2 /> Paket ablehnen
                </SubmitButton>
              </form>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
