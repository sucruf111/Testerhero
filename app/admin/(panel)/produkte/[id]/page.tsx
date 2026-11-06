import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, Shuffle, Star, Trash2, UsersRound } from "lucide-react";
import { PageHeader, Panel, StatCard, Tabs } from "@/components/admin/ui";
import { ProductImage } from "@/components/product-image";
import { buttonClass } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { Badge, EmptyState, Stars } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteProductAction, distributeNowAction, setProductStatusAction } from "@/lib/actions/admin";
import { getAdminProduct, getProductApplications, getProductStatusCounts, getReviews } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth/session";
import { isBlobConfigured } from "@/lib/config";
import { APPLICATION_STATUS, PRODUCT_STATUS } from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/db/schema";
import { formatDate, formatEuro } from "@/lib/format";
import { ReviewCard } from "../../bewertungen/review-card";
import { ProductForm } from "../product-form";
import { ApplicantsTable } from "./applicants-table";

export const metadata: Metadata = { title: "Produkt" };

const STATUS_FILTERS: ApplicationStatus[] = ["accepted", "shipped", "received", "reviewed", "rejected", "withdrawn"];

export default async function AdminProductPage({ params, searchParams }: PageProps<"/admin/produkte/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const product = await getAdminProduct(id);
  if (!product) notFound();

  const tab = sp.tab === "bewertungen" || sp.tab === "bearbeiten" ? sp.tab : "tester";
  const statusFilter = STATUS_FILTERS.includes(sp.status as ApplicationStatus) ? (sp.status as ApplicationStatus) : undefined;
  const s = PRODUCT_STATUS[product.status];
  const base = `/admin/produkte/${id}`;
  const free = Math.max(0, product.slots - product.takenSlots);
  const price = formatEuro(product.retailPriceCents);

  return (
    <div>
      <PageHeader
        back={{ href: "/admin/produkte", label: "Produkte" }}
        title={
          <span className="flex items-center gap-3">
            <span className="size-10 shrink-0 overflow-hidden rounded-lg border border-line">
              <ProductImage src={product.imageUrl} alt="" category={product.category} />
            </span>
            <span className="min-w-0">{product.title}</span>
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge tone={s.tone}>{s.label}</Badge>
            <span>{product.category}</span>
            {product.applicationDeadline && <span>Verteilen bis {formatDate(product.applicationDeadline)}</span>}
            {price && <span>Wert {price}</span>}
          </span>
        }
        actions={<StatusSwitch id={product.id} status={product.status} />}
      />

      {sp.verteilt !== undefined && Number(sp.verteilt) > 0 && (
        <Alert tone="success" className="mb-4">
          {sp.verteilt} {Number(sp.verteilt) === 1 ? "Paket wurde" : "Pakete wurden"} ausgelost.
        </Alert>
      )}
      {sp.gespeichert && !(Number(sp.verteilt) > 0) && (
        <Alert tone="success" className="mb-4">
          Gespeichert.
        </Alert>
      )}
      {sp.fehler === "bewerbungen" && (
        <Alert tone="error" className="mb-4">
          Dieses Produkt wurde schon verteilt und kann nicht gelöscht werden. Stell es stattdessen auf „Beendet“.
        </Alert>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Verteilt" value={`${product.takenSlots} / ${product.slots}`} hint={free > 0 ? `${free} noch frei` : "alle verteilt"} />
        <StatCard label="Zu versenden" value={product.toShipCount} accent={product.toShipCount > 0} href={product.toShipCount ? "/admin/versand" : undefined} />
        <StatCard label="Beim Tester" value={product.takenSlots - product.toShipCount - product.reviewCount} />
        <StatCard
          label="Bewertungen"
          value={product.reviewCount}
          hint={product.avgRating ? `Durchschnitt ${product.avgRating.toLocaleString("de-DE", { maximumFractionDigits: 1 })} Sterne` : undefined}
        />
      </div>

      {product.status === "active" && free > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-sun-300 bg-sun-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">{free} {free === 1 ? "Platz ist" : "Plätze sind"} noch frei.</span> Sie gehen automatisch an
            Tester, sobald welche ausgelost werden können, zum Beispiel neue Anmeldungen.
          </p>
          <form action={distributeNowAction}>
            <input type="hidden" name="id" value={product.id} />
            <SubmitButton size="sm" variant="secondary" pendingText="Lose aus …">
              <Shuffle /> Jetzt verteilen
            </SubmitButton>
          </form>
        </div>
      )}

      <Tabs
        items={[
          { href: base, label: "Tester", count: product.applicantCount, active: tab === "tester" },
          { href: `${base}?tab=bewertungen`, label: "Bewertungen", count: product.reviewCount, active: tab === "bewertungen" },
          { href: `${base}?tab=bearbeiten`, label: "Bearbeiten", active: tab === "bearbeiten" },
        ]}
      />

      <div className="mt-4">
        {tab === "tester" && <TestersTab productId={id} base={base} statusFilter={statusFilter} productStatus={product.status} />}
        {tab === "bewertungen" && <ReviewsTab productId={id} />}
        {tab === "bearbeiten" && (
          <div className="space-y-5">
            <ProductForm
              blobEnabled={isBlobConfigured()}
              initial={{
                ...product,
                retailPrice: product.retailPriceCents != null ? (product.retailPriceCents / 100).toFixed(2).replace(".", ",") : "",
              }}
            />
            <Panel title="Produkt löschen">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">Geht nur, solange das Produkt noch an niemanden verteilt wurde.</p>
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
  const next =
    status === "active" ? { to: "closed", label: "Beenden" } : { to: "active", label: status === "draft" ? "Aktivieren und verteilen" : "Wieder aktivieren" };
  return (
    <form action={setProductStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={next.to} />
      <SubmitButton
        variant={status === "active" ? "secondary" : "primary"}
        size="sm"
        confirm={status === "active" ? "Produkt beenden? Freie Plätze werden dann nicht mehr verteilt." : undefined}
      >
        {next.label}
      </SubmitButton>
    </form>
  );
}

async function TestersTab({
  productId,
  base,
  statusFilter,
  productStatus,
}: {
  productId: string;
  base: string;
  statusFilter?: ApplicationStatus;
  productStatus: string;
}) {
  const [apps, counts] = await Promise.all([getProductApplications(productId, statusFilter), getProductStatusCounts(productId)]);
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <FilterLink href={base} active={!statusFilter}>
            Alle ({total})
          </FilterLink>
          {STATUS_FILTERS.filter((st) => counts[st]).map((st) => (
            <FilterLink key={st} href={`${base}?status=${st}`} active={statusFilter === st}>
              {APPLICATION_STATUS[st].label} ({counts[st]})
            </FilterLink>
          ))}
        </div>
        {(counts.accepted ?? 0) > 0 && (
          <a href={`/admin/export/versand?produkt=${productId}`} className={buttonClass("secondary", "sm")}>
            <Download /> Versandliste (CSV)
          </a>
        )}
      </div>

      {apps.length === 0 ? (
        <EmptyState icon={<UsersRound />} title="Noch an niemanden verteilt">
          {productStatus === "active"
            ? "Sobald Tester ausgelost werden können, erscheinen sie hier."
            : "Stell das Produkt auf „Aktiv“, dann wird es sofort per Zufall verteilt."}
        </EmptyState>
      ) : (
        <ApplicantsTable apps={apps} />
      )}
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={
        active
          ? "rounded-lg border border-ink bg-ink px-2.5 py-1 text-[13px] font-medium text-white"
          : "rounded-lg border border-line bg-white px-2.5 py-1 text-[13px] font-medium text-ink-soft hover:border-ink/30"
      }
    >
      {children}
    </a>
  );
}

async function ReviewsTab({ productId }: { productId: string }) {
  const reviews = await getReviews(productId);
  if (reviews.length === 0) {
    return (
      <EmptyState icon={<Star />} title="Noch keine Bewertungen">
        Sobald Tester ihr Paket bewertet haben, steht es hier.
      </EmptyState>
    );
  }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const recommend = reviews.filter((r) => r.wouldRecommend).length;
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-3xl font-bold">{avg.toLocaleString("de-DE", { maximumFractionDigits: 1 })}</span>
          <div>
            <Stars value={avg} />
            <p className="text-sm text-muted">
              {reviews.length} Bewertungen · {Math.round((recommend / reviews.length) * 100)} % würden es weiterempfehlen
            </p>
          </div>
        </div>
        <a href={`/admin/export/bewertungen?produkt=${productId}`} className={buttonClass("secondary", "sm")}>
          <Download /> CSV
        </a>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} showProduct={false} />
        ))}
      </div>
    </div>
  );
}
