import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, PackageCheck, PackageOpen, PenLine, Search, Undo2 } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { StatusSteps } from "@/components/site/status-steps";
import { buttonClass, LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { Badge, EmptyState, Stars } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { confirmReceivedAction, reactivateAction, withdrawApplicationAction } from "@/lib/actions/tester";
import { requireTester } from "@/lib/auth/session";
import { APPLICATION_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getTesterApplications } from "@/lib/queries";
import { trackingUrl } from "@/lib/tracking";
import { ResendVerification } from "./resend-verification";

export const metadata: Metadata = { title: "Meine Tests" };

export default async function KontoPage({ searchParams }: PageProps<"/konto">) {
  const tester = await requireTester("/konto");
  const [apps, params] = await Promise.all([getTesterApplications(tester.id), searchParams]);

  const todo = apps.filter((a) => a.status === "shipped" || a.status === "received");
  const others = apps.filter((a) => !todo.includes(a));
  const stats = {
    applied: apps.filter((a) => a.status !== "withdrawn").length,
    active: apps.filter((a) => ["accepted", "shipped", "received"].includes(a.status)).length,
    reviewed: apps.filter((a) => a.status === "reviewed").length,
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        {params.willkommen && (
          <Alert tone="success" title="Willkommen bei TesterHero! 🎉">
            Dein Konto wurde erstellt. Wir haben dir eine E-Mail geschickt – bitte bestätige deine Adresse, dann kannst du dich bewerben.
          </Alert>
        )}
        {params.bewertet && (
          <Alert tone="success" title="Danke für deine Bewertung!">
            Dein Feedback hilft dem Produktteam enorm weiter.
          </Alert>
        )}
        {params.passwort && <Alert tone="success">Dein neues Passwort ist gespeichert.</Alert>}
        {params.reaktiviert && <Alert tone="success">Schön, dass du wieder dabei bist! Dein Konto ist wieder aktiv.</Alert>}

        {tester.status === "active" && !tester.emailVerifiedAt && <ResendVerification email={tester.email} />}

        {tester.status === "unsubscribed" && (
          <div className="flex flex-col gap-4 rounded-3xl bg-sand p-6 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Du bist derzeit abgemeldet.</p>
              <p className="mt-1 text-[15px] text-muted">Du erhältst keine Produkte und keine E-Mails von uns. Möchtest du wieder mitmachen?</p>
            </div>
            <form action={reactivateAction}>
              <SubmitButton>Konto reaktivieren</SubmitButton>
            </form>
          </div>
        )}
        {tester.status === "blocked" && (
          <Alert tone="error" title="Dein Konto ist gesperrt.">
            Bitte wende dich an unser Team, wenn du Fragen dazu hast.
          </Alert>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-3 sm:gap-5">
        <Stat label="Bewerbungen" value={stats.applied} />
        <Stat label="Laufende Tests" value={stats.active} />
        <Stat label="Bewertungen" value={stats.reviewed} />
      </dl>

      {apps.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="Noch keine Bewerbungen"
          action={<LinkButton href="/produkte">Produkttests entdecken</LinkButton>}
        >
          Such dir ein Produkt aus, das dich interessiert, und bewirb dich mit einem Klick.
        </EmptyState>
      ) : (
        <>
          {todo.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-semibold">Zu erledigen</h2>
              <div className="mt-4 space-y-4">
                {todo.map((a) => (
                  <ApplicationCard key={a.id} app={a} highlight />
                ))}
              </div>
            </section>
          )}
          {others.length > 0 && (
            <section>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl font-semibold">{todo.length ? "Weitere Tests" : "Meine Tests"}</h2>
                <Link href="/produkte" className="text-sm font-semibold text-coral-600 hover:text-coral-700">
                  Neue Produkte entdecken →
                </Link>
              </div>
              <div className="mt-4 space-y-4">
                {others.map((a) => (
                  <ApplicationCard key={a.id} app={a} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-soft ring-1 ring-line/70 sm:p-6">
      <dt className="text-xs font-semibold text-muted sm:text-sm">{label}</dt>
      <dd className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{value}</dd>
    </div>
  );
}

type App = Awaited<ReturnType<typeof getTesterApplications>>[number];

function ApplicationCard({ app, highlight = false }: { app: App; highlight?: boolean }) {
  const s = APPLICATION_STATUS[app.status];
  const track = trackingUrl(app.carrier, app.trackingNumber);
  const canReview = app.status === "shipped" || app.status === "received";

  return (
    <article
      className={
        highlight
          ? "overflow-hidden rounded-3xl bg-white shadow-lift ring-2 ring-coral-200"
          : "overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line/70"
      }
    >
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
        <Link href={`/produkte/${app.product.slug}`} className="block size-24 shrink-0 overflow-hidden rounded-2xl ring-1 ring-line/70 sm:size-28">
          <ProductImage src={app.product.imageUrl} alt={app.product.title} category={app.product.category} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/produkte/${app.product.slug}`} className="font-display text-xl font-semibold hover:text-coral-600">
                {app.product.title}
              </Link>
              <p className="mt-0.5 text-sm text-muted">Beworben am {formatDate(app.createdAt)}</p>
            </div>
            <Badge tone={s.tone}>{s.testerLabel}</Badge>
          </div>

          <div className="mt-5 max-w-lg">
            <StatusSteps status={app.status} />
          </div>

          {app.status === "shipped" && (app.trackingNumber || app.carrier) && (
            <p className="mt-4 text-sm text-ink-soft">
              {app.carrier && <span className="font-semibold">{app.carrier}</span>}
              {app.trackingNumber && (
                <>
                  {" "}· Sendungsnr.{" "}
                  {track ? (
                    <a href={track} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-coral-600 hover:underline">
                      {app.trackingNumber} <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    <span className="font-mono">{app.trackingNumber}</span>
                  )}
                </>
              )}
            </p>
          )}

          {app.review && (
            <div className="mt-4 rounded-2xl bg-cream p-4 ring-1 ring-line/70">
              <Stars value={app.review.rating} size="sm" />
              <p className="mt-1 font-semibold">„{app.review.title}“</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {app.status === "shipped" && (
              <form action={confirmReceivedAction}>
                <input type="hidden" name="applicationId" value={app.id} />
                <SubmitButton variant="secondary" size="sm">
                  <PackageCheck /> Paket ist angekommen
                </SubmitButton>
              </form>
            )}
            {canReview && (
              <Link href={`/konto/bewertung/${app.id}`} className={buttonClass("primary", "sm")}>
                <PenLine /> Jetzt bewerten
              </Link>
            )}
            {app.status === "pending" && (
              <form action={withdrawApplicationAction}>
                <input type="hidden" name="applicationId" value={app.id} />
                <SubmitButton variant="ghost" size="sm" confirm="Möchtest du deine Bewerbung wirklich zurückziehen?">
                  <Undo2 /> Bewerbung zurückziehen
                </SubmitButton>
              </form>
            )}
            {app.status === "accepted" && (
              <p className="inline-flex items-center gap-2 text-sm text-muted">
                <PackageOpen className="size-4 text-coral-500" /> Wir bereiten den Versand vor – bitte prüfe deine Lieferadresse im Profil.
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
