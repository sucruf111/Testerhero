import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { isBlobConfigured } from "@/lib/config";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Neues Produkt" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div>
      <PageHeader
        back={{ href: "/admin/produkte", label: "Produkte" }}
        title="Neues Produkt"
        description="Als Entwurf speichern oder direkt auf „Aktiv“ stellen. Aktive Produkte werden sofort verteilt."
      />
      <ProductForm blobEnabled={isBlobConfigured()} />
    </div>
  );
}
