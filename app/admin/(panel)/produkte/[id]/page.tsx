import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, Download, ExternalLink, Star, Trash2, Truck, Users } from "lucide-react";
import { PageHeader, Panel, StatCard, Tabs } from "@/components/admin/ui";
import { ProductImage } from "@/components/product-image";
import { buttonClass } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { Badge, EmptyState, Stars } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteProductAction, setProductStatusAction } from "@/lib/actions/admin";
import { getAdminProduct, getProductApplications, getProductStatusCounts, getReviews } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth/session";
import { isBlobConfigured } from "@/lib/config";
import { APPLICATION_STATUS, PRODUCT_STATUS } from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/db/schema";
import { deadlineLabel, formatDate, formatEuro } from "@/lib/format";
import { ProductForm } from "../product-form";
import { ApplicantsTable } from "./applicants-table";
import { NotifyTestersForm } from "./notify-form";
import { ReviewCard } from "../../bewertungen/review-card";

export const metadata: Metadata = { title: "Produkt" };

const STATUS_FILTERS: ApplicationStatus[] = ["pending", "accepted", "shipped", "received", "reviewed", "rejected", "withdrawn"];

export default async function AdminProductPage({ params, searchParams }: PageProps<"/admin/produkte/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const product = await getAdminProduct(id);
  if (!product) notFound();

  const tab = sp.tab === "bewertungen" || sp.tab === "bearbeiten" ? sp.tab : "bewerbungen";
  const statusFilter = STATUS_FILTERS.includes(sp.status as ApplicationStatus) ? (sp.status as ApplicationStatus) : undefined;
  const s = PRODUCT_STATUS[product.status];
  const base = `/admin/produkte/${id}`;

  return (
    <div>
      <PageHeader
        back={{ href: "/admin/produkte", label: "Produkte" }}
        title={
          <span className="flex items-center gap-4">
            <span className="size-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-line/70">
              <ProductImage src={product.imageUrl} alt="" category={product.category} />
            </span>
            <span className="min-w-0">{product.title}</span>
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge tone={s.tone}>{s.label}</Badge>
            <span>{product.category}</span>
            {product.applicationDeadline && (
              <span>
                Frist: {formatDate(product.applicationDeadline)} ({deadlineLabel(product.applicationDeadline)})
              </span>
            )}
            {formatEuro(product.retailPriceCents) && <span>Wert {formatEuro(product.retailPriceCents)}</span>}
          </span>
        }
        actions={
          <>
            {product.status !== "draft" && (
              <Link href={`/produkte/${product.slug}`} target="_blank" className={buttonClass("secondary", "sm")}>
                <ExternalLink /> Ansehen
              </Link>
            )}
            <StatusSwitch id={product.id} status={product.status} />
          </>
        }
      />

      {sp.gespeichert && <Alert tone="success" className="mb-6">Das Produkt wurde gespeichert.</Alert>}
      {sp.fehler === "bewerbungen" && (
        <Alert tone="error" className="mb-6">
          Produkte mit Bewerbungen können nicht gelöscht werden. Setze das Produkt stattdessen auf „Abgeschlossen“.
        </Alert>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vergebene Plätze" value={`${product.takenSlots} / ${product.slots}`} icon={<Users />} />
        <StatCard label="Neue Bewerbungen" value={product.pendingCount} hint={`${product.applicantCount} insgesamt`} icon={<ClipboardList />} accent={product.pendingCount > 0} />
        <StatCard label="Zu versenden" value={product.toShipCount} icon={<Truck />} href={product.toShipCount ? "/admin/versand" : undefined} />
        <StatCard
          label="Bewertungen"
          value={product.reviewCount}
          hint={product.avgRating ? `Ø ${product.avgRating.toLocaleString("de-DE", { maximumFractionDigits: 1 })} Sterne` : undefined}
          icon={<Star />}
        />
      </div>

      <Tabs
        items={[
          { href: base, label: "Bewerbungen", count: product.applicantCount, active: tab === "bewerbungen" },
          { href: `${base}?tab=bewertungen`, label: "Bewertungen", count: product.reviewCount, active: tab === "bewertungen" },
          { href: `${base}?tab=bearbeiten`, label: "Bearbeiten", active: tab === "bearbeiten" },
        ]}
      />

      <div className="mt-6">
        {tab === "bewerbungen" && <ApplicationsTab productId={id} base={base} statusFilter={statusFilter} productStatus={product.status} notifiedAt={product.notifiedAt} />}
        {tab === "bewertungen" && <ReviewsTab productId={id} />}
        {tab === "bearbeiten" && (
          <div className="space-y-8">
            <ProductForm
              blobEnabled={isBlobConfigured()}
              initial={{
                ...product,
                retailPrice: product.retailPriceCents != null ? (product.retailPriceCents / 100).toFixed(2).replace(".", ",") : "",
              }}
            />
            <Panel title="Produkt löschen">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">
                  Nur möglich, solange keine Bewerbungen vorhanden sind. Ansonsten das Produkt auf „Abgeschlossen“ setzen.
                </p>
                <form action={deleteProductAction}>
                  <input type="hidden" name="id" value={id} />
                  <SubmitButton variant="danger" size="sm" confirm="Produkt endgültig löschen?">
                    <Trash2 /> Löschen
                  </SubmitButton>
                </form>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusSwitch({ id, status }: { id: string; status: "draft" | "active" | "closed" }) {
  const next = status === "active" ? { to: "closed", label: "Bewerbung schließen" } : { to: "active", label: status === "draft" ? "Veröffentlichen" : "Wieder öffnen" };
  return (
    <form action={setProductStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={next.to} />
      <SubmitButton variant={status === "active" ? "secondary" : "primary"} size="sm">
        {next.label}
      </SubmitButton>
    </form>
  );
}

async function ApplicationsTab({
  productId,
  base,
  statusFilter,
  productStatus,
  notifiedAt,
}: {
  productId: string;
  base: string;
  statusFilter?: ApplicationStatus;
  productStatus: string;
  notifiedAt: Date | null;
}) {
  const [apps, counts] = await Promise.all([getProductApplications(productId, statusFilter), getProductStatusCounts(productId)]);
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div className="space-y-6">
      {productStatus === "active" && <NotifyTestersForm productId={productId} notifiedAt={notifiedAt?.toISOString() ?? null} />}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          items={[
            { href: base, label: "Alle", count: total, active: !statusFilter },
            ...STATUS_FILTERS.filter((st) => counts[st]).map((st) => ({
              href: `${base}?status=${st}`,
              label: APPLICATION_STATUS[st].label,
              count: counts[st],
              active: statusFilter === st,
            })),
          ]}
        />
        {(counts.accepted ?? 0) > 0 && (
          <a href={`/admin/export/versand?produkt=${productId}`} className={buttonClass("secondary", "sm")}>
            <Download /> Versandliste (CSV)
          </a>
        )}
      </div>

      {apps.length === 0 ? (
        <EmptyState icon={<ClipboardList />} title={statusFilter ? "Keine Bewerbungen mit diesem Status" : "Noch keine Bewerbungen"}>
          {productStatus === "active"
            ? "Sobald sich Tester bewerben, erscheinen sie hier. Tipp: Informiere passende Tester per E-Mail."
            : "Setze das Produkt auf „Bewerbung offen“, damit sich Tester bewerben können."}
        </EmptyState>
      ) : (
        <ApplicantsTable apps={apps} />
      )}
    </div>
  );
}

async function ReviewsTab({ productId }: { productId: string }) {
  const reviews = await getReviews(productId);
  if (reviews.length === 0) {
    return (
      <EmptyState icon={<Star />} title="Noch keine Bewertungen">
        Sobald Tester ihre Bewertung abgeben, erscheint sie hier.
      </EmptyState>
    );
  }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const recommend = reviews.filter((r) => r.wouldRecommend).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-line/70 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="font-display text-5xl font-semibold">{avg.toLocaleString("de-DE", { maximumFractionDigits: 1 })}</span>
          <div>
            <Stars value={avg} />
            <p className="mt-1 text-sm text-muted">
              {reviews.length} Bewertungen · {Math.round((recommend / reviews.length) * 100)} % würden es weiterempfehlen
            </p>
          </div>
        </div>
        <a href={`/admin/export/bewertungen?produkt=${productId}`} className={buttonClass("secondary", "sm")}>
          <Download /> Als CSV exportieren
        </a>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} showProduct={false} />
        ))}
      </div>
    </div>
  );
}
