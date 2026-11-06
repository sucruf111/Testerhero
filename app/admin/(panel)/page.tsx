import Link from "next/link";
import { ClipboardList, PackageCheck, Plus, Star, Truck, UsersRound } from "lucide-react";
import { Panel, PageHeader, StatCard } from "@/components/admin/ui";
import { LinkButton } from "@/components/ui/button";
import { Avatar, Badge, EmptyState, Stars } from "@/components/ui/misc";
import { getAdminProducts, getDashboardStats, getRecentApplications } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth/session";
import { APPLICATION_STATUS } from "@/lib/constants";
import { deadlineLabel, formatRelative } from "@/lib/format";

export default async function AdminDashboard() {
  await requireAdmin();
  const [stats, recent, products] = await Promise.all([getDashboardStats(), getRecentApplications(), getAdminProducts("active")]);

  return (
    <div>
      <PageHeader
        title="Übersicht"
        description="Alles Wichtige zu euren Produkttests auf einen Blick."
        actions={
          <LinkButton href="/admin/produkte/neu" size="sm">
            <Plus /> Neues Produkt
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent
          label="Neue Bewerbungen"
          value={stats.applications.pending}
          hint="warten auf eure Auswahl"
          icon={<ClipboardList />}
          href="/admin/produkte"
        />
        <StatCard label="Zu versenden" value={stats.applications.accepted} hint="ausgewählt, noch nicht verschickt" icon={<Truck />} href="/admin/versand" />
        <StatCard
          label="Aktive Tester"
          value={stats.testers.active}
          hint={`+${stats.testers.newLast30} in den letzten 30 Tagen`}
          icon={<UsersRound />}
          href="/admin/tester"
        />
        <StatCard
          label="Bewertungen"
          value={stats.reviews.total}
          hint={
            stats.reviews.average ? (
              <span className="inline-flex items-center gap-1.5">
                <Stars value={stats.reviews.average} size="sm" /> Ø {stats.reviews.average.toLocaleString("de-DE", { maximumFractionDigits: 1 })}
              </span>
            ) : (
              "noch keine Bewertungen"
            )
          }
          icon={<Star />}
          href="/admin/bewertungen"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Laufende Produkttests"
          actions={
            <Link href="/admin/produkte" className="text-sm font-semibold text-coral-600 hover:text-coral-700">
              Alle Produkte →
            </Link>
          }
          padded={products.length === 0}
        >
          {products.length === 0 ? (
            <EmptyState icon={<PackageCheck />} title="Kein aktiver Produkttest" action={<LinkButton href="/admin/produkte/neu">Produkt anlegen</LinkButton>}>
              Lege ein Produkt an und setze es auf „Bewerbung offen“, damit sich Tester bewerben können.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line/70">
              {products.map((p) => {
                const pct = Math.min(100, (p.takenSlots / Math.max(1, p.slots)) * 100);
                return (
                  <li key={p.id}>
                    <Link href={`/admin/produkte/${p.id}`} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-cream sm:flex-row sm:items-center sm:px-6">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{p.title}</p>
                        <p className="mt-0.5 text-sm text-muted">
                          {p.applicantCount} Bewerbungen · {deadlineLabel(p.applicationDeadline) ?? "keine Frist"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 sm:w-40">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                          <div className="h-full rounded-full bg-gradient-to-r from-coral-500 to-sun-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-12 text-right text-sm font-semibold tabular-nums">
                          {p.takenSlots}/{p.slots}
                        </span>
                      </div>
                      {p.pendingCount > 0 && <Badge tone="amber">{p.pendingCount} neu</Badge>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Neueste Bewerbungen" padded={recent.length === 0}>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">Noch keine Bewerbungen eingegangen.</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {recent.map((app) => {
                const s = APPLICATION_STATUS[app.status];
                const name = `${app.tester.firstName} ${app.tester.lastName}`;
                return (
                  <li key={app.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                    <Avatar name={name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        <Link href={`/admin/tester/${app.tester.id}`} className="font-semibold hover:text-coral-600">
                          {name}
                        </Link>{" "}
                        <span className="text-muted">→</span>{" "}
                        <Link href={`/admin/produkte/${app.product.id}`} className="hover:text-coral-600">
                          {app.product.title}
                        </Link>
                      </p>
                      <p className="text-xs text-muted">
                        {app.tester.city} · {formatRelative(app.createdAt)}
                      </p>
                    </div>
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {(stats.testers.unverified > 0 || stats.testers.unsubscribed > 0) && (
        <p className="mt-6 text-sm text-muted">
          {stats.testers.unverified} Tester haben ihre E-Mail-Adresse noch nicht bestätigt · {stats.testers.unsubscribed} haben sich abgemeldet.
        </p>
      )}
    </div>
  );
}
