import type { Metadata } from "next";
import Link from "next/link";
import { Download, Search, UsersRound } from "lucide-react";
import { PageHeader, Tabs, td, th } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { Alert, Input, Select } from "@/components/ui/form";
import { Avatar, Badge, EmptyState } from "@/components/ui/misc";
import { getTesters, type TesterFilter } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth/session";
import { CATEGORIES, TESTER_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Tester" };

const STATUS_VALUES = ["active", "unverified", "unsubscribed", "blocked"] as const;

export default async function AdminTestersPage({ searchParams }: PageProps<"/admin/tester">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const status = STATUS_VALUES.find((s) => s === sp.status);
  const interest = CATEGORIES.find((c) => c === sp.interesse);
  const page = Number(sp.seite) || 1;
  const filter: TesterFilter = { q: q || undefined, status, interest, page };
  const result = await getTesters(filter);

  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q: q || undefined, status, interesse: interest, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return `/admin/tester${s ? `?${s}` : ""}`;
  };
  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (status) exportParams.set("status", status);
  if (interest) exportParams.set("interesse", interest);

  return (
    <div>
      <PageHeader
        title="Tester"
        description={`${result.total} ${result.total === 1 ? "Person" : "Personen"} gefunden`}
        actions={
          <a href={`/admin/export/tester?${exportParams}`} className={buttonClass("secondary", "sm")}>
            <Download /> CSV exportieren
          </a>
        }
      />
      {sp.geloescht && <Alert tone="success" className="mb-6">Der Tester wurde gelöscht.</Alert>}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
            <Input name="q" defaultValue={q} placeholder="Name, E-Mail, Ort, PLZ …" className="h-11 py-0 pl-10 sm:w-72" aria-label="Tester suchen" />
          </div>
          <Select name="interesse" defaultValue={interest ?? ""} className="h-11 py-0 sm:w-52" aria-label="Nach Interesse filtern">
            <option value="">Alle Interessen</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <button type="submit" className={buttonClass("dark", "md", "h-11")}>
            Filtern
          </button>
        </form>
      </div>

      <div className="mt-6">
        {result.rows.length === 0 ? (
          <EmptyState icon={<UsersRound />} title="Keine Tester gefunden">
            {q || status || interest ? "Versuche es mit anderen Filtern." : "Sobald sich Tester registrieren, erscheinen sie hier."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-white shadow-soft ring-1 ring-line/70">
            <table className="w-full min-w-[56rem]">
              <thead className="border-b border-line/70 bg-cream/60">
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Ort</th>
                  <th className={th}>Interessen</th>
                  <th className={th}>Bewerb. / Tests / Bewert.</th>
                  <th className={th}>Registriert</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {result.rows.map((t) => {
                  const name = `${t.firstName} ${t.lastName}`;
                  const st = TESTER_STATUS[t.status];
                  return (
                    <tr key={t.id} className="transition hover:bg-cream/60">
                      <td className={td}>
                        <Link href={`/admin/tester/${t.id}`} className="flex items-center gap-3">
                          <Avatar name={name} />
                          <span className="min-w-0">
                            <span className="block font-semibold hover:text-coral-600">{name}</span>
                            <span className="block truncate text-xs text-muted">{t.email}</span>
                          </span>
                        </Link>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>
                        {t.postalCode} {t.city}
                      </td>
                      <td className={td}>
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {t.interests.slice(0, 2).map((i) => (
                            <span key={i} className="rounded-full bg-sand px-2 py-0.5 text-xs text-ink-soft">
                              {i}
                            </span>
                          ))}
                          {t.interests.length > 2 && <span className="text-xs text-muted">+{t.interests.length - 2}</span>}
                        </div>
                      </td>
                      <td className={`${td} tabular-nums`}>
                        {t.applications} / {t.tests} / {t.reviews}
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
          <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Seiten">
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
