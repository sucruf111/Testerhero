CREATE TABLE "settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"max_claims_per_window" smallint DEFAULT 3 NOT NULL,
	"claim_window_days" smallint DEFAULT 30 NOT NULL,
	"max_open_tests" smallint DEFAULT 2 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "testers" ADD COLUMN "address_key" text;--> statement-breakpoint
CREATE INDEX "testers_address_key_idx" ON "testers" USING btree ("address_key");--> statement-breakpoint
INSERT INTO "settings" ("id") VALUES (1) ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "testers" SET "address_key" = "country" || '|' || trim("postal_code") || '|' || regexp_replace(regexp_replace(lower("street"), 'stra(ss|ß)e', 'str', 'g'), '[^a-z0-9äöüß]', '', 'g') WHERE "address_key" IS NULL;
