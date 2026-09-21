CREATE TABLE "chef_reviews" (
	"user_id" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"rejection_reason" text,
	"flagged_question_ids" json,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp,
	"resubmitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chef_reviews" ADD CONSTRAINT "chef_reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chef_reviews" ADD CONSTRAINT "chef_reviews_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;