import type { Metadata } from "next";
import Link from "next/link";
import { Download, Search, UsersRound } from "lucide-react";
import { PageHeader, Tabs, td, th } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { Alert, Input } from "@/components/ui/form";
import { Avatar, Badge, EmptyState } from "@/components/ui/misc";
import { getTesters, type TesterFilter } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth/session";
import { TESTER_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Tester" };

const STATUS_VALUES = ["active", "unverified", "unsubscribed", "blocked"] as const;

export default async function AdminTestersPage({ searchParams }: PageProps<"/admin/tester">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const status = STATUS_VALUES.find((s) => s === sp.status);
  const page = Number(sp.seite) || 1;
  const filter: TesterFilter = { q: q || undefined, status, page };
  const result = await getTesters(filter);

  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q: q || undefined, status, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return `/admin/tester${s ? `?${s}` : ""}`;
  };
  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (status) exportParams.set("status", status);

  return (
    <div>
      <PageHeader
        title="Tester"
        description={`${result.total} ${result.total === 1 ? "Person" : "Personen"}`}
        actions={
          <a href={`/admin/export/tester?${exportParams}`} className={buttonClass("secondary", "sm")}>
            <Download /> CSV exportieren
          </a>
        }
      />
      {sp.geloescht && <Alert tone="success" className="mb-4">Der Tester ist gelöscht.</Alert>}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <Tabs
          items={[
            { href: qs({ status: undefined }), label: "Alle", active: !status },
            { href: qs({ status: "active" }), label: "Aktiv", active: status === "active" },
            { href: qs({ status: "unverified" }), label: "Unbestätigt", active: status === "unverified" },
            { href: qs({ status: "unsubscribed" }), label: "Abgemeldet", active: status === "unsubscribed" },
            { href: qs({ status: "blocked" }), label: "Gesperrt", active: status === "blocked" },
          ]}
        />
        <form className="flex flex-col gap-2 sm:flex-row" action="/admin/tester">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <Input name="q" defaultValue={q} placeholder="Name, E-Mail, Ort, PLZ" className="h-9 py-0 pl-9 text-sm sm:w-64" aria-label="Tester suchen" />
          </div>
          <button type="submit" className={buttonClass("dark", "sm", "h-9")}>
            Suchen
          </button>
        </form>
      </div>

      <div className="mt-4">
        {result.rows.length === 0 ? (
          <EmptyState icon={<UsersRound />} title="Keine Tester gefunden">
            {q || status ? "Versuch es mit einer anderen Suche." : "Sobald sich jemand anmeldet, steht er hier."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full min-w-[44rem]">
              <thead className="border-b border-line bg-cream/60">
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Ort</th>
                  <th className={th}>Pakete / Bewertet</th>
                  <th className={th}>Registriert</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.rows.map((t) => {
                  const name = `${t.firstName} ${t.lastName}`;
                  const st = TESTER_STATUS[t.status];
                  return (
                    <tr key={t.id} className="transition hover:bg-cream/60">
                      <td className={td}>
                        <Link href={`/admin/tester/${t.id}`} className="flex items-center gap-3">
                          <Avatar name={name} className="size-7 text-[10px]" />
                          <span className="min-w-0">
                            <span className="block font-semibold hover:text-coral-600">{name}</span>
                            <span className="block truncate text-xs text-muted">{t.email}</span>
                          </span>
                        </Link>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>
                        {t.postalCode} {t.city}
                      </td>
                      <td className={`${td} tabular-nums`}>
                        {t.applications} / {t.reviews}
                      </td>
                      <td className={`${td} text-muted`}>{formatDate(t.createdAt)}</td>
                      <td className={td}>
                        <div className="flex flex-wrap gap-1">
                          <Badge tone={st.tone}>{st.label}</Badge>
                          {!t.emailVerifiedAt && t.status === "active" && <Badge tone="amber" dot={false}>unbestätigt</Badge>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {result.pages > 1 && (
          <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Seiten">
            <span className="text-muted">
              Seite {result.page} von {result.pages}
            </span>
            <div className="flex gap-2">
              {result.page > 1 && (
                <Link href={qs({ seite: String(result.page - 1) })} className={buttonClass("secondary", "sm")}>
                  ← Zurück
                </Link>
              )}
              {result.page < result.pages && (
                <Link href={qs({ seite: String(result.page + 1) })} className={buttonClass("secondary", "sm")}>
                  Weiter →
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
