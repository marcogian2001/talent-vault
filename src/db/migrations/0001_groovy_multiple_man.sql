CREATE TABLE "onboarding_answer_files" (
	"id" text PRIMARY KEY NOT NULL,
	"answer_id" text NOT NULL,
	"url" text NOT NULL,
	"pathname" text NOT NULL,
	"original_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"question_id" text NOT NULL,
	"value" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"help_text" text,
	"placeholder" text,
	"required" boolean DEFAULT true NOT NULL,
	"options" json,
	"config" json,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_questions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "onboarding_answer_files" ADD CONSTRAINT "onboarding_answer_files_answer_id_onboarding_answers_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."onboarding_answers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_answers" ADD CONSTRAINT "onboarding_answers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_answers" ADD CONSTRAINT "onboarding_answers_question_id_onboarding_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."onboarding_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "onboarding_answer_files_answer_idx" ON "onboarding_answer_files" USING btree ("answer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_answers_user_question_uq" ON "onboarding_answers" USING btree ("user_id","question_id");--> statement-breakpoint
CREATE INDEX "onboarding_answers_question_idx" ON "onboarding_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "onboarding_questions_status_order_idx" ON "onboarding_questions" USING btree ("status","sort_order");