import type { Metadata } from "next";
import Link from "next/link";
import { PackagePlus, Plus } from "lucide-react";
import { PageHeader, Tabs, td, th } from "@/components/admin/ui";
import { ProductImage } from "@/components/product-image";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { Badge, EmptyState, Stars } from "@/components/ui/misc";
import { getAdminProducts } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth/session";
import { PRODUCT_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Produkte" };

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/produkte">) {
  await requireAdmin();
  const { status, geloescht } = await searchParams;
  const filter = status === "draft" || status === "active" || status === "closed" ? status : undefined;
  const all = await getAdminProducts();
  const products = filter ? all.filter((p) => p.status === filter) : all;
  const countBy = (s: string) => all.filter((p) => p.status === s).length;

  return (
    <div>
      <PageHeader
        title="Produkte"
        description="Aktive Produkte werden automatisch per Zufall an Tester verteilt."
        actions={
          <LinkButton href="/admin/produkte/neu" size="sm">
            <Plus /> Neues Produkt
          </LinkButton>
        }
      />
      {geloescht && (
        <Alert tone="success" className="mb-4">
          Das Produkt ist gelöscht.
        </Alert>
      )}

      <Tabs
        items={[
          { href: "/admin/produkte", label: "Alle", count: all.length, active: !filter },
          { href: "/admin/produkte?status=active", label: "Aktiv", count: countBy("active"), active: filter === "active" },
          { href: "/admin/produkte?status=draft", label: "Entwürfe", count: countBy("draft"), active: filter === "draft" },
          { href: "/admin/produkte?status=closed", label: "Beendet", count: countBy("closed"), active: filter === "closed" },
        ]}
      />

      <div className="mt-4">
        {products.length === 0 ? (
          <EmptyState icon={<PackagePlus />} title="Noch keine Produkte" action={<LinkButton href="/admin/produkte/neu">Produkt anlegen</LinkButton>}>
            Leg ein Produkt an. Sobald es aktiv ist, wird es an Tester verteilt.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full min-w-[44rem]">
              <thead className="border-b border-line bg-cream/60">
                <tr>
                  <th className={th}>Produkt</th>
                  <th className={th}>Status</th>
                  <th className={th}>Verteilt</th>
                  <th className={th}>Zu versenden</th>
                  <th className={th}>Bewertungen</th>
                  <th className={th}>Verteilen bis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((p) => {
                  const s = PRODUCT_STATUS[p.status];
                  return (
                    <tr key={p.id} className="transition hover:bg-cream/60">
                      <td className={td}>
                        <Link href={`/admin/produkte/${p.id}`} className="flex items-center gap-3">
                          <span className="size-9 shrink-0 overflow-hidden rounded-lg border border-line">
                            <ProductImage src={p.imageUrl} alt="" category={p.category} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold hover:text-coral-600">{p.title}</span>
                            <span className="block text-xs text-muted">{p.category}</span>
                          </span>
                        </Link>
                      </td>
                      <td className={td}>
                        <Badge tone={s.tone}>{s.label}</Badge>
                      </td>
                      <td className={`${td} tabular-nums`}>
                        <span className="font-semibold">{p.takenSlots}</span>
                        <span className="text-muted"> / {p.slots}</span>
                      </td>
                      <td className={`${td} tabular-nums`}>{p.toShipCount > 0 ? <Badge tone="violet">{p.toShipCount}</Badge> : <span className="text-muted">–</span>}</td>
                      <td className={td}>
                        {p.reviewCount > 0 && p.avgRating ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Stars value={p.avgRating} size="sm" />
                            <span className="text-muted">({p.reviewCount})</span>
                          </span>
                        ) : (
                          <span className="text-muted">–</span>
                        )}
                      </td>
                      <td className={`${td} text-muted`}>{formatDate(p.applicationDeadline)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
