import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban, Mail, Phone, Trash2, UserCheck } from "lucide-react";
import { PageHeader, Panel, td, th } from "@/components/admin/ui";
import { Textarea } from "@/components/ui/form";
import { Avatar, Badge, Stars } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteTesterAction, setTesterStatusAction, updateTesterNoteAction } from "@/lib/actions/admin";
import { getTesterDetail } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth/session";
import { APPLICATION_STATUS, COUNTRIES, TESTER_STATUS } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import { CopyAddress } from "../../versand/copy-address";

export const metadata: Metadata = { title: "Tester" };

export default async function AdminTesterPage({ params }: PageProps<"/admin/tester/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const tester = await getTesterDetail(id);
  if (!tester) notFound();

  const name = `${tester.firstName} ${tester.lastName}`;
  const st = TESTER_STATUS[tester.status];
  const addressLines = [
    name,
    tester.street,
    tester.addressExtra,
    `${tester.postalCode} ${tester.city}`,
    COUNTRIES[tester.country] ?? tester.country,
  ].filter(Boolean) as string[];
  const reviews = tester.applications.filter((a) => a.review).map((a) => ({ ...a.review!, productTitle: a.product.title }));

  return (
    <div>
      <PageHeader
        back={{ href: "/admin/tester", label: "Tester" }}
        title={
          <span className="flex items-center gap-4">
            <Avatar name={name} className="size-10 text-sm" />
            {name}
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={st.tone}>{st.label}</Badge>
            {tester.emailVerifiedAt ? <Badge tone="green" dot={false}>E-Mail bestätigt</Badge> : <Badge tone="amber" dot={false}>E-Mail unbestätigt</Badge>}
          </span>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[20rem_1fr]">
        <div className="space-y-4">
          <Panel title="Lieferadresse">
            <address className="text-sm leading-relaxed not-italic">
              {addressLines.map((l, i) => (
                <span key={i} className={i === 0 ? "block font-semibold" : "block text-ink-soft"}>
                  {l}
                </span>
              ))}
            </address>
            <CopyAddress text={addressLines.join("\n")} />
            <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
              <a href={`mailto:${tester.email}`} className="flex items-center gap-2 text-ink-soft hover:text-coral-600">
                <Mail className="size-4 text-muted" /> {tester.email}
              </a>
              {tester.phone && (
                <a href={`tel:${tester.phone}`} className="flex items-center gap-2 text-ink-soft hover:text-coral-600">
                  <Phone className="size-4 text-muted" /> {tester.phone}
                </a>
              )}
            </div>
          </Panel>

          <Panel title="Profil">
            <dl className="space-y-2 text-sm">
              <Row label="Geburtsjahr" value={tester.birthYear ? `${tester.birthYear} (${new Date().getFullYear() - tester.birthYear} J.)` : "–"} />
              <Row label="18+ bestätigt" value={tester.ageConfirmedAt ? "Ja" : "Nein"} />
              <Row label="Erotikprodukte" value={tester.adultOptIn && tester.ageConfirmedAt ? "Ja, erlaubt" : "Nein"} />
              <Row label="Angemeldet seit" value={formatDate(tester.createdAt)} />
              <Row label="Letzter Login" value={formatDateTime(tester.lastLoginAt)} />
              {tester.unsubscribedAt && <Row label="Abgemeldet am" value={formatDate(tester.unsubscribedAt)} />}
            </dl>
          </Panel>

          <Panel title="Interne Notiz">
            <form action={updateTesterNoteAction} className="space-y-3">
              <input type="hidden" name="testerId" value={tester.id} />
              <Textarea name="adminNote" rows={4} defaultValue={tester.adminNote ?? ""} placeholder="Nur für euch sichtbar" />
              <SubmitButton variant="secondary" size="sm">
                Notiz speichern
              </SubmitButton>
            </form>
          </Panel>

          <Panel title="Konto">
            <div className="flex flex-col gap-2">
              {tester.status !== "active" && (
                <StatusButton testerId={tester.id} status="active" icon={<UserCheck />} label="Wieder aktivieren" />
              )}
              {tester.status !== "blocked" && (
                <StatusButton
                  testerId={tester.id}
                  status="blocked"
                  icon={<Ban />}
                  label="Sperren"
                  confirm="Tester sperren? Noch nicht verschickte Pakete werden neu ausgelost."
                />
              )}
              <form action={deleteTesterAction}>
                <input type="hidden" name="testerId" value={tester.id} />
                <SubmitButton variant="ghost" size="sm" className="w-full justify-start text-red-700 hover:bg-red-50" confirm={`${name} mit allen Daten endgültig löschen?`}>
                  <Trash2 /> Mit allen Daten löschen
                </SubmitButton>
              </form>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title={`Pakete (${tester.applications.length})`} padded={tester.applications.length === 0}>
            {tester.applications.length === 0 ? (
              <p className="text-sm text-muted">Noch keine Pakete.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem]">
                  <thead className="border-b border-line">
                    <tr>
                      <th className={th}>Produkt</th>
                      <th className={th}>Ausgelost</th>
                      <th className={th}>Versand</th>
                      <th className={th}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {tester.applications.map((a) => {
                      const s = APPLICATION_STATUS[a.status];
                      return (
                        <tr key={a.id}>
                          <td className={td}>
                            <Link href={`/admin/produkte/${a.product.id}`} className="font-semibold hover:text-coral-600">
                              {a.product.title}
                            </Link>
                          </td>
                          <td className={`${td} text-muted`}>{formatDate(a.decidedAt ?? a.createdAt)}</td>
                          <td className={`${td} text-muted`}>
                            {a.shippedAt ? formatDate(a.shippedAt) : "–"}
                          </td>
                          <td className={td}>
                            <Badge tone={s.tone}>{s.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {reviews.length > 0 && (
            <Panel title={`Bewertungen (${reviews.length})`}>
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-line pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <Stars value={r.rating} size="sm" />
                      <span className="text-xs font-semibold tracking-wide text-coral-600 uppercase">{r.productTitle}</span>
                      <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 font-semibold">„{r.title}“</p>
                    <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink-soft">{r.body}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function StatusButton({ testerId, status, icon, label, confirm }: { testerId: string; status: string; icon: React.ReactNode; label: string; confirm?: string }) {
  return (
    <form action={setTesterStatusAction}>
      <input type="hidden" name="testerId" value={testerId} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton variant="secondary" size="sm" className="w-full justify-start" confirm={confirm}>
        {icon} {label}
      </SubmitButton>
    </form>
  );
}
