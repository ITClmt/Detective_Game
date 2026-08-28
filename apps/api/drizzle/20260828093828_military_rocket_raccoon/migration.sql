CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" varchar NOT NULL UNIQUE,
	"title" varchar NOT NULL,
	"sort_order" integer NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"unlock_requirement" uuid,
	"content" jsonb NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"state" jsonb NOT NULL,
	"solved_at" timestamp,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "player_cases_user_id_case_id_unique" UNIQUE("user_id","case_id")
);
--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_unlock_requirement_cases_id_fkey" FOREIGN KEY ("unlock_requirement") REFERENCES "cases"("id");--> statement-breakpoint
ALTER TABLE "player_cases" ADD CONSTRAINT "player_cases_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "player_cases" ADD CONSTRAINT "player_cases_case_id_cases_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE;