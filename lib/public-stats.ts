import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Echte Zahlen für die Startseite. Es wird nichts geschätzt oder aufgerundet:
 * Was hier steht, steht so in der Datenbank.
 */
export type PublicStats = {
  /** aktive Produkte in der laufenden Runde */
  activeProducts: number;
  /** Plätze aller aktiven Produkte */
  totalSlots: number;
  /** davon noch nicht vergeben */
  freeSlots: number;
  /** bestätigte Anmeldungen der letzten 7 Tage */
  newTesters7d: number;
  /** verschickte Pakete der letzten 30 Tage */
  shipped30d: number;
};

const EMPTY: PublicStats = { activeProducts: 0, totalSlots: 0, freeSlots: 0, newTesters7d: 0, shipped30d: 0 };

export async function getPublicStats(): Promise<PublicStats> {
  try {
    const rows = (await db.execute(sql`
      select
        (select count(*) from testerhero.products p where p.status = 'active')::int as active_products,
        (select coalesce(sum(p.slots), 0) from testerhero.products p where p.status = 'active')::int as total_slots,
        (select coalesce(sum(greatest(p.slots - (
            select count(*) from testerhero.applications x
            where x.product_id = p.id and x.status in ('accepted','shipped','received','reviewed')
          ), 0)), 0)
          from testerhero.products p where p.status = 'active')::int as free_slots,
        (select count(*) from testerhero.testers t
          where t.email_verified_at is not null and t.created_at > now() - interval '7 days')::int as new_testers,
        (select count(*) from testerhero.applications x
          where x.shipped_at is not null and x.shipped_at > now() - interval '30 days')::int as shipped
    `)) as unknown as {
      active_products: number;
      total_slots: number;
      free_slots: number;
      new_testers: number;
      shipped: number;
    }[];
    const r = rows[0];
    if (!r) return EMPTY;
    return {
      activeProducts: r.active_products,
      totalSlots: r.total_slots,
      freeSlots: r.free_slots,
      newTesters7d: r.new_testers,
      shipped30d: r.shipped,
    };
  } catch (error) {
    // Die Startseite soll auch ohne Zahlen funktionieren
    console.error("Statistik nicht geladen", error);
    return EMPTY;
  }
}
