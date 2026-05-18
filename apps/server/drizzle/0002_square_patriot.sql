CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lost_report_id" uuid NOT NULL,
	"found_report_id" uuid NOT NULL,
	"proposed_by" uuid NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "matches_lost_found_unique" UNIQUE("lost_report_id","found_report_id")
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_lost_report_id_reports_id_fk" FOREIGN KEY ("lost_report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_found_report_id_reports_id_fk" FOREIGN KEY ("found_report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_proposed_by_users_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;