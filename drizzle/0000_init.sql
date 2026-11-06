CREATE TYPE "public"."application_status" AS ENUM('pending', 'accepted', 'shipped', 'received', 'reviewed', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."tester_status" AS ENUM('active', 'unsubscribed', 'blocked');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"tester_id" uuid NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"motivation" text,
	"tracking_number" text,
	"carrier" text,
	"decided_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"brand" text,
	"category" text NOT NULL,
	"short_description" text NOT NULL,
	"description" text NOT NULL,
	"test_instructions" text,
	"image_url" text,
	"amazon_url" text,
	"retail_price_cents" integer,
	"slots" integer DEFAULT 10 NOT NULL,
	"application_deadline" date,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"tester_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"pros" text,
	"cons" text,
	"would_recommend" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"street" text NOT NULL,
	"address_extra" text,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"country" text DEFAULT 'DE' NOT NULL,
	"phone" text,
	"birth_year" smallint,
	"interests" text[] DEFAULT '{}'::text[] NOT NULL,
	"notify_new_products" boolean DEFAULT true NOT NULL,
	"status" "tester_status" DEFAULT 'active' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"consent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_tester_id_testers_id_fk" FOREIGN KEY ("tester_id") REFERENCES "public"."testers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tester_id_testers_id_fk" FOREIGN KEY ("tester_id") REFERENCES "public"."testers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "applications_product_tester_idx" ON "applications" USING btree ("product_id","tester_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "applications_tester_idx" ON "applications" USING btree ("tester_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_application_idx" ON "reviews" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "testers_email_idx" ON "testers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "testers_status_idx" ON "testers" USING btree ("status");