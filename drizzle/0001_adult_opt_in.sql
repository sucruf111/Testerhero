ALTER TABLE "testerhero"."products" ADD COLUMN "adult" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "testerhero"."testers" ADD COLUMN "age_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "testerhero"."testers" ADD COLUMN "adult_opt_in" boolean DEFAULT false NOT NULL;