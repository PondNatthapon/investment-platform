CREATE TYPE "public"."account_type" AS ENUM('BROKERAGE', 'CASH');--> statement-breakpoint
CREATE TYPE "public"."asset_class" AS ENUM('STOCK', 'ETF', 'BOND', 'FUND', 'REIT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('STATEMENT', 'WITHHOLDING_TAX', 'TRANSACTION_REPORT', 'ANNUAL_SUMMARY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('BUY', 'SELL');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"broker" varchar(100) NOT NULL,
	"account_type" "account_type" DEFAULT 'BROKERAGE' NOT NULL,
	"base_currency" varchar(3) NOT NULL,
	"account_number" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dividends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"security_id" uuid NOT NULL,
	"paid_at" date NOT NULL,
	"gross_amount" numeric(30, 10) NOT NULL,
	"withholding_tax" numeric(30, 10) DEFAULT '0' NOT NULL,
	"net_amount" numeric(30, 10) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dividends_gross_non_negative" CHECK ("dividends"."gross_amount" >= 0),
	CONSTRAINT "dividends_withholding_non_negative" CHECK ("dividends"."withholding_tax" >= 0),
	CONSTRAINT "dividends_net_non_negative" CHECK ("dividends"."net_amount" >= 0),
	CONSTRAINT "dividends_withholding_not_above_gross" CHECK ("dividends"."withholding_tax" <= "dividends"."gross_amount")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"type" "document_type" NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"mime_type" varchar(100),
	"file_size" integer,
	"checksum_sha256" varchar(64),
	"document_date" date,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fx_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"from_currency" varchar(3) NOT NULL,
	"to_currency" varchar(3) NOT NULL,
	"amount_from" numeric(30, 10) NOT NULL,
	"amount_to" numeric(30, 10) NOT NULL,
	"exchange_rate" numeric(30, 12) NOT NULL,
	"fee" numeric(30, 10) DEFAULT '0' NOT NULL,
	"transaction_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fx_amount_from_positive" CHECK ("fx_transactions"."amount_from" > 0),
	CONSTRAINT "fx_amount_to_positive" CHECK ("fx_transactions"."amount_to" > 0),
	CONSTRAINT "fx_exchange_rate_positive" CHECK ("fx_transactions"."exchange_rate" > 0),
	CONSTRAINT "fx_fee_non_negative" CHECK ("fx_transactions"."fee" >= 0),
	CONSTRAINT "fx_currencies_different" CHECK ("fx_transactions"."from_currency" <> "fx_transactions"."to_currency")
);
--> statement-breakpoint
CREATE TABLE "securities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"asset_class" "asset_class" NOT NULL,
	"exchange" varchar(32),
	"currency" varchar(3) NOT NULL,
	"isin" varchar(12),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"security_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"quantity" numeric(30, 10) NOT NULL,
	"price" numeric(30, 10) NOT NULL,
	"gross_amount" numeric(30, 10) NOT NULL,
	"fee" numeric(30, 10) DEFAULT '0' NOT NULL,
	"currency" varchar(3) NOT NULL,
	"transaction_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_quantity_positive" CHECK ("transactions"."quantity" > 0),
	CONSTRAINT "transactions_price_non_negative" CHECK ("transactions"."price" >= 0),
	CONSTRAINT "transactions_gross_amount_non_negative" CHECK ("transactions"."gross_amount" >= 0),
	CONSTRAINT "transactions_fee_non_negative" CHECK ("transactions"."fee" >= 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"timezone" varchar(64) DEFAULT 'Asia/Bangkok' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dividends" ADD CONSTRAINT "dividends_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dividends" ADD CONSTRAINT "dividends_security_id_securities_id_fk" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fx_transactions" ADD CONSTRAINT "fx_transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_security_id_securities_id_fk" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dividends_account_id_idx" ON "dividends" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "dividends_security_id_idx" ON "dividends" USING btree ("security_id");--> statement-breakpoint
CREATE INDEX "dividends_paid_at_idx" ON "dividends" USING btree ("paid_at");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_file_path_unique" ON "documents" USING btree ("file_path");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_checksum_unique" ON "documents" USING btree ("checksum_sha256");--> statement-breakpoint
CREATE INDEX "documents_account_id_idx" ON "documents" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "documents_document_date_idx" ON "documents" USING btree ("document_date");--> statement-breakpoint
CREATE INDEX "fx_transactions_account_id_idx" ON "fx_transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "fx_transactions_transaction_at_idx" ON "fx_transactions" USING btree ("transaction_at");--> statement-breakpoint
CREATE UNIQUE INDEX "securities_symbol_exchange_unique" ON "securities" USING btree ("symbol","exchange");--> statement-breakpoint
CREATE INDEX "securities_symbol_idx" ON "securities" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "transactions_account_id_idx" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transactions_security_id_idx" ON "transactions" USING btree ("security_id");--> statement-breakpoint
CREATE INDEX "transactions_transaction_at_idx" ON "transactions" USING btree ("transaction_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");