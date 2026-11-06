import Link from "next/link";
import { Plus, Shuffle } from "lucide-react";
import { Panel, PageHeader, StatCard } from "@/components/admin/ui";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { Badge, Stars } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { distributeNowAction } from "@/lib/actions/admin";
import { getAdminProducts, getDashboardStats, getRecentApplications } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth/session";
import { getUnfilledSlots } from "@/lib/claims";
import { APPLICATION_STATUS } from "@/lib/constants";
import { formatRelative } from "@/lib/format";

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const [stats, recent, products, unfilled, params] = await Promise.all([
    getDashboardStats(),
    getRecentApplications(8),
    getAdminProducts("active"),
    getUnfilledSlots(),
    searchParams,
  ]);

  return (
    <div>
      <PageHeader
        title="Übersicht"
        actions={
          <LinkButton href="/admin/produkte/neu" size="sm">
            <Plus /> Neues Produkt
          </LinkButton>
        }
      />

      {params.verteilt !== undefined && (
        <Alert tone="success" className="mb-4">
          {Number(params.verteilt) > 0 ? `${params.verteilt} Pakete neu ausgelost.` : "Es konnte gerade niemand neu ausgelost werden."}
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard accent label="Zu versenden" value={stats.applications.accepted} hint="ausgelost, noch nicht verschickt" href="/admin/versand" />
        <StatCard label="Beim Tester" value={stats.applications.inTest} hint="verschickt, noch nicht bewertet" />
        <StatCard
          label="Aktive Tester"
          value={stats.testers.ready}
          hint={`+${stats.testers.newLast30} in 30 Tagen`}
          href="/admin/tester"
        />
        <StatCard
          label="Bewertungen"
          value={stats.reviews.total}
          hint={
            stats.reviews.average ? (
              <span className="inline-flex items-center gap-1">
                <Stars value={stats.reviews.average} size="sm" /> {stats.reviews.average.toLocaleString("de-DE", { maximumFractionDigits: 1 })}
              </span>
            ) : (
              "noch keine"
            )
          }
          href="/admin/bewertungen"
        />
      </div>

      {unfilled > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-sun-300 bg-sun-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">{unfilled} {unfilled === 1 ? "Platz ist" : "Plätze sind"} noch frei.</span> Sie gehen
            automatisch an Tester, sobald welche ausgelost werden können, zum Beispiel neue Anmeldungen.
          </p>
          <form action={distributeNowAction}>
            <SubmitButton size="sm" variant="secondary" pendingText="Lose aus …">
              <Shuffle /> Jetzt verteilen
            </SubmitButton>
          </form>
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Panel
          title="Aktive Produkte"
          actions={
            <Link href="/admin/produkte" className="text-sm font-semibold text-coral-600 hover:text-coral-700">
              Alle
            </Link>
          }
          padded={products.length === 0}
        >
          {products.length === 0 ? (
            <p className="text-sm text-muted">Kein Produkt aktiv. Lege ein Produkt an und stell es auf „Aktiv“, dann wird es sofort verteilt.</p>
          ) : (
            <ul className="divide-y divide-line">
              {products.map((p) => {
                const pct = Math.min(100, (p.takenSlots / Math.max(1, p.slots)) * 100);
                return (
                  <li key={p.id}>
                    <Link href={`/admin/produkte/${p.id}`} className="flex items-center gap-4 px-4 py-3 transition hover:bg-cream">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.title}</span>
                      <span className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-sand sm:block">
                        <span className="block h-full rounded-full bg-coral-500" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-14 text-right text-sm tabular-nums text-muted">
                        {p.takenSlots}/{p.slots}
                      </span>
                      {p.toShipCount > 0 && <Badge tone="violet">{p.toShipCount} versenden</Badge>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Zuletzt ausgelost" padded={recent.length === 0}>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">Noch nichts ausgelost.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((app) => {
                const s = APPLICATION_STATUS[app.status];
                return (
                  <li key={app.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        <Link href={`/admin/tester/${app.tester.id}`} className="font-semibold hover:text-coral-600">
                          {app.tester.firstName} {app.tester.lastName}
                        </Link>
                        <span className="text-muted"> · {app.product.title}</span>
                      </p>
                      <p className="text-xs text-muted">{formatRelative(app.decidedAt ?? app.createdAt)}</p>
                    </div>
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
