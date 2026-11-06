import type { Metadata } from "next";
import Link from "next/link";
import { Download, PackageCheck, Truck } from "lucide-react";
import { PageHeader, Panel } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { bulkApplicationsAction, updateApplicationAction } from "@/lib/actions/admin";
import { getRecentlyShipped, getShippingQueue } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth/session";
import { COUNTRIES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { SelectAll } from "../produkte/[id]/select-all";
import { CopyAddress } from "./copy-address";

export const metadata: Metadata = { title: "Versand" };

export default async function ShippingPage() {
  await requireAdmin();
  const [queue, shipped] = await Promise.all([getShippingQueue(), getRecentlyShipped()]);

  // nach Produkt gruppieren
  const groups = new Map<string, { title: string; items: typeof queue }>();
  for (const app of queue) {
    const g = groups.get(app.productId) ?? { title: app.product.title, items: [] };
    g.items.push(app);
    groups.set(app.productId, g);
  }

  return (
    <div>
      <PageHeader
        title="Versand"
        description="Diese Pakete wurden ausgelost und müssen noch verschickt werden."
        actions={
          queue.length > 0 && (
            <a href="/admin/export/versand" className={buttonClass("primary", "sm")}>
              <Download /> Versandliste (CSV)
            </a>
          )
        }
      />

      {queue.length === 0 ? (
        <EmptyState icon={<PackageCheck />} title="Alles verschickt">
          Sobald neue Pakete ausgelost werden, stehen die Adressen hier.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {[...groups.entries()].map(([productId, group]) => {
            const formId = `ship-${productId}`;
            return (
              <Panel
                key={productId}
                padded={false}
                title={
                  <Link href={`/admin/produkte/${productId}`} className="hover:text-coral-600">
                    {group.title} <Badge tone="violet" className="ml-1.5 align-middle">{group.items.length}</Badge>
                  </Link>
                }
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`/admin/export/versand?produkt=${productId}`} className={buttonClass("secondary", "sm")}>
                      <Download /> CSV
                    </a>
                    <form id={formId} action={bulkApplicationsAction} className="flex items-center gap-2">
                      <input type="hidden" name="status" value="shipped" />
                      <SelectAll formId={formId} />
                      <SubmitButton size="sm" variant="dark">
                        <Truck /> Markierte versendet
                      </SubmitButton>
                    </form>
                  </div>
                }
              >
                <ul className="divide-y divide-line">
                  {group.items.map((app) => {
                    const t = app.tester;
                    const lines = [
                      `${t.firstName} ${t.lastName}`,
                      t.street,
                      t.addressExtra,
                      `${t.postalCode} ${t.city}`,
                      t.country !== "DE" ? COUNTRIES[t.country] ?? t.country : null,
                    ].filter(Boolean) as string[];
                    return (
                      <li key={app.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                        <input
                          type="checkbox"
                          name="ids"
                          value={app.id}
                          form={formId}
                          aria-label={`${t.firstName} ${t.lastName} markieren`}
                          className="checkbox-check size-[18px] cursor-pointer rounded-[5px] border border-ink/25 bg-white checked:border-coral-500 checked:bg-coral-500"
                        />
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-6">
                          <address className="text-sm leading-relaxed not-italic">
                            <Link href={`/admin/tester/${t.id}`} className="font-semibold hover:text-coral-600">
                              {lines[0]}
                            </Link>
                            {lines.slice(1).map((l) => (
                              <span key={l} className="block text-ink-soft">
                                {l}
                              </span>
                            ))}
                          </address>
                          <div className="text-sm text-muted">
                            {t.phone && <p>Tel. {t.phone}</p>}
                            <p>{t.email}</p>
                            <p className="mt-1 text-xs">Ausgelost am {formatDate(app.decidedAt)}</p>
                            <CopyAddress text={lines.join("\n")} />
                          </div>
                        </div>
                        <form action={updateApplicationAction} className="lg:justify-self-end">
                          <input type="hidden" name="applicationId" value={app.id} />
                          <input type="hidden" name="status" value="shipped" />
                          <SubmitButton size="sm">
                            <Truck /> Versendet
                          </SubmitButton>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            );
          })}
        </div>
      )}

      {shipped.length > 0 && (
        <Panel title="Zuletzt versendet" className="mt-6" padded={false}>
          <ul className="divide-y divide-line">
            {shipped.map((app) => (
              <li key={app.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span>
                  <Link href={`/admin/tester/${app.tester.id}`} className="font-semibold hover:text-coral-600">
                    {app.tester.firstName} {app.tester.lastName}
                  </Link>
                  <span className="text-muted"> · {app.tester.city} · {app.product.title}</span>
                </span>
                <span className="text-muted">
                  {formatDate(app.shippedAt)}
                  {app.status === "received" && <Badge tone="coral" className="ml-2">Angekommen</Badge>}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
