CREATE TYPE "public"."financial_event_status" AS ENUM('CONFIRMED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."import_batch_status" AS ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL');--> statement-breakpoint
CREATE TYPE "public"."import_source_type" AS ENUM('PDF', 'CSV', 'SCREENSHOT', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."normalized_draft_status" AS ENUM('NEEDS_REVIEW', 'CONFIRMED', 'REJECTED', 'NEEDS_RECONCILIATION');--> statement-breakpoint
CREATE TYPE "public"."normalized_draft_type" AS ENUM('TRADE', 'DEPOSIT', 'WITHDRAWAL', 'ACTUAL_FX', 'DIVIDEND', 'FEE', 'TAX', 'PORTFOLIO_SNAPSHOT', 'PORTFOLIO_VALUE_SNAPSHOT', 'CASH_BALANCE_SNAPSHOT', 'INTERNAL_TRANSFER');--> statement-breakpoint
CREATE TABLE "final_financial_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"broker_id" uuid NOT NULL,
	"draft_id" uuid NOT NULL,
	"event_type" "normalized_draft_type" NOT NULL,
	"status" "financial_event_status" DEFAULT 'CONFIRMED' NOT NULL,
	"finalized_at" timestamp with time zone DEFAULT now() NOT NULL,
	"final_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"broker_id" uuid NOT NULL,
	"source_type" "import_source_type" NOT NULL,
	"source_document_id" uuid,
	"source_reference" varchar(255),
	"parser_name" varchar(100),
	"parser_version" varchar(50),
	"import_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"import_completed_at" timestamp with time zone,
	"status" "import_batch_status" DEFAULT 'QUEUED' NOT NULL,
	"status_message" text,
	"source_checksum_sha256" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "normalized_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"broker_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"document_id" uuid,
	"event_type" "normalized_draft_type" NOT NULL,
	"external_id" varchar(255),
	"source_locator" varchar(255),
	"source_page" integer,
	"source_row" integer,
	"source_region" varchar(255),
	"source_image_ref" text,
	"parser_name" varchar(100),
	"parser_version" varchar(50),
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_at" timestamp with time zone,
	"currency" varchar(3),
	"amount" numeric(30, 10),
	"quantity" numeric(30, 10),
	"unit_price" numeric(30, 10),
	"security_symbol" varchar(32),
	"status" "normalized_draft_status" DEFAULT 'NEEDS_REVIEW' NOT NULL,
	"review_reason" text,
	"raw_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"normalized_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idempotency_key" varchar(255),
	"duplicate_of_draft_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "final_financial_events" ADD CONSTRAINT "final_financial_events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_financial_events" ADD CONSTRAINT "final_financial_events_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_financial_events" ADD CONSTRAINT "final_financial_events_draft_id_normalized_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."normalized_drafts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "normalized_drafts" ADD CONSTRAINT "normalized_drafts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "normalized_drafts" ADD CONSTRAINT "normalized_drafts_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "normalized_drafts" ADD CONSTRAINT "normalized_drafts_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "normalized_drafts" ADD CONSTRAINT "normalized_drafts_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "final_financial_events_account_id_idx" ON "final_financial_events" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "final_financial_events_draft_id_idx" ON "final_financial_events" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX "final_financial_events_status_idx" ON "final_financial_events" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "import_batches_account_document_unique" ON "import_batches" USING btree ("account_id","source_document_id");--> statement-breakpoint
CREATE INDEX "import_batches_account_id_idx" ON "import_batches" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "import_batches_broker_id_idx" ON "import_batches" USING btree ("broker_id");--> statement-breakpoint
CREATE INDEX "import_batches_status_idx" ON "import_batches" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "normalized_drafts_account_external_unique" ON "normalized_drafts" USING btree ("account_id","external_id") WHERE "normalized_drafts"."external_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "normalized_drafts_account_document_locator_unique" ON "normalized_drafts" USING btree ("account_id","document_id","source_locator") WHERE "normalized_drafts"."document_id" is not null AND "normalized_drafts"."source_locator" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "normalized_drafts_idempotency_unique" ON "normalized_drafts" USING btree ("account_id","idempotency_key") WHERE "normalized_drafts"."idempotency_key" is not null;--> statement-breakpoint
CREATE INDEX "normalized_drafts_account_id_idx" ON "normalized_drafts" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "normalized_drafts_broker_id_idx" ON "normalized_drafts" USING btree ("broker_id");--> statement-breakpoint
CREATE INDEX "normalized_drafts_batch_id_idx" ON "normalized_drafts" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "normalized_drafts_status_idx" ON "normalized_drafts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "normalized_drafts_document_id_idx" ON "normalized_drafts" USING btree ("document_id");