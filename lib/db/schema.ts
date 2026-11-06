import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgSchema,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Alle Tabellen liegen im eigenen Schema „testerhero“.
 * So kommt die App nicht mit anderen Tabellen in derselben Datenbank in Konflikt.
 */
export const dbSchema = pgSchema("testerhero");

/* ───────────── Enums ───────────── */

/** active = nimmt teil · unsubscribed = hat sich abgemeldet · blocked = von der Agentur gesperrt */
export const testerStatus = dbSchema.enum("tester_status", ["active", "unsubscribed", "blocked"]);

export const productStatus = dbSchema.enum("product_status", ["draft", "active", "closed"]);

/**
 * Ablauf eines Pakets (Überraschungsbox):
 * accepted (ausgelost) → shipped (versendet) → received (ausgepackt) → reviewed (bewertet)
 * Abzweigungen: rejected (von der Agentur storniert) · withdrawn (vom Tester abgelehnt oder abgemeldet)
 * pending wird aktuell nicht mehr verwendet.
 */
export const applicationStatus = dbSchema.enum("application_status", [
  "pending",
  "accepted",
  "shipped",
  "received",
  "reviewed",
  "rejected",
  "withdrawn",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ───────────── Tester ───────────── */

export const testers = dbSchema.table(
  "testers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    street: text("street").notNull(),
    addressExtra: text("address_extra"),
    postalCode: text("postal_code").notNull(),
    city: text("city").notNull(),
    country: text("country").notNull().default("DE"),
    phone: text("phone"),
    birthYear: smallint("birth_year"),
    interests: text("interests")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    notifyNewProducts: boolean("notify_new_products").notNull().default(true),
    status: testerStatus("status").notNull().default("active"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull().defaultNow(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    /** Normalisierte Adresse – verhindert, dass ein Haushalt dasselbe Produkt mehrfach bekommt */
    addressKey: text("address_key"),
    /** Zeitpunkt, an dem der Tester bestätigt hat, mindestens 18 Jahre alt zu sein */
    ageConfirmedAt: timestamp("age_confirmed_at", { withTimezone: true }),
    /** Möchte auch Erotikprodukte bekommen (freiwillig, nur mit Altersbestätigung) */
    adultOptIn: boolean("adult_opt_in").notNull().default(false),
    /** Interne Notiz der Agentur – für Tester unsichtbar */
    adminNote: text("admin_note"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("testers_email_idx").on(t.email),
    index("testers_status_idx").on(t.status),
    index("testers_address_key_idx").on(t.addressKey),
  ],
);

/* ───────────── Einstellungen (eine Zeile) ───────────── */

export const settings = dbSchema.table("settings", {
  id: smallint("id").primaryKey().default(1),
  /** Wie viele Produkte eine Person innerhalb von `claimWindowDays` bekommen darf */
  maxClaimsPerWindow: smallint("max_claims_per_window").notNull().default(3),
  claimWindowDays: smallint("claim_window_days").notNull().default(30),
  /** Wie viele Tests gleichzeitig offen (noch nicht bewertet) sein dürfen */
  maxOpenTests: smallint("max_open_tests").notNull().default(2),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* ───────────── Produkte ───────────── */

export const products = dbSchema.table(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    brand: text("brand"),
    category: text("category").notNull(),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    testInstructions: text("test_instructions"),
    imageUrl: text("image_url"),
    amazonUrl: text("amazon_url"),
    /** Warenwert in Cent (optional) */
    retailPriceCents: integer("retail_price_cents"),
    slots: integer("slots").notNull().default(10),
    /** Erotikprodukt: geht nur an Tester ab 18, die das ausdrücklich erlaubt haben */
    adult: boolean("adult").notNull().default(false),
    applicationDeadline: date("application_deadline", { mode: "string" }),
    status: productStatus("status").notNull().default("draft"),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("products_slug_idx").on(t.slug), index("products_status_idx").on(t.status)],
);

/* ───────────── Bewerbungen ───────────── */

export const applications = dbSchema.table(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    testerId: uuid("tester_id")
      .notNull()
      .references(() => testers.id, { onDelete: "cascade" }),
    status: applicationStatus("status").notNull().default("pending"),
    motivation: text("motivation"),
    // Werden aktuell nicht genutzt (keine Sendungsnummern), bleiben für spätere Erweiterungen
    trackingNumber: text("tracking_number"),
    carrier: text("carrier"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("applications_product_tester_idx").on(t.productId, t.testerId),
    index("applications_status_idx").on(t.status),
    index("applications_tester_idx").on(t.testerId),
  ],
);

/* ───────────── Bewertungen ───────────── */

export const reviews = dbSchema.table(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    testerId: uuid("tester_id")
      .notNull()
      .references(() => testers.id, { onDelete: "cascade" }),
    rating: smallint("rating").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    pros: text("pros"),
    cons: text("cons"),
    wouldRecommend: boolean("would_recommend").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("reviews_application_idx").on(t.applicationId),
    index("reviews_product_idx").on(t.productId),
  ],
);

/* ───────────── Relationen ───────────── */

export const testersRelations = relations(testers, ({ many }) => ({
  applications: many(applications),
  reviews: many(reviews),
}));

export const productsRelations = relations(products, ({ many }) => ({
  applications: many(applications),
  reviews: many(reviews),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  product: one(products, { fields: [applications.productId], references: [products.id] }),
  tester: one(testers, { fields: [applications.testerId], references: [testers.id] }),
  review: one(reviews, { fields: [applications.id], references: [reviews.applicationId] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  application: one(applications, {
    fields: [reviews.applicationId],
    references: [applications.id],
  }),
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  tester: one(testers, { fields: [reviews.testerId], references: [testers.id] }),
}));

export type Settings = typeof settings.$inferSelect;
export type Tester = typeof testers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type ApplicationStatus = (typeof applicationStatus.enumValues)[number];
export type ProductStatus = (typeof productStatus.enumValues)[number];
export type TesterStatus = (typeof testerStatus.enumValues)[number];
