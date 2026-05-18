CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"reporter_id" uuid NOT NULL,
	"status" text NOT NULL,
	"species" text NOT NULL,
	"breed" text,
	"name" text,
	"color" text,
	"description" text,
	"photo_key" text,
	"contact_phone" text,
	"contact_email" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"event_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;