CREATE TABLE "brokers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(64) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "brokers_code_unique" ON "brokers" USING btree ("code");
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "broker_id" uuid;
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
INSERT INTO "brokers" ("code", "display_name", "metadata")
SELECT
	CASE lower(btrim("broker"))
		WHEN 'demo broker' THEN 'DEMO'
		WHEN 'dime' THEN 'DIME'
		WHEN 'webull thailand' THEN 'WEBULL_TH'
		ELSE 'LEGACY_' || upper(md5(lower(btrim("broker"))))
	END,
	CASE lower(btrim("broker"))
		WHEN 'demo broker' THEN 'Demo Broker'
		WHEN 'dime' THEN 'Dime'
		WHEN 'webull thailand' THEN 'Webull Thailand'
		ELSE min(btrim("broker"))
	END,
	CASE lower(btrim("broker"))
		WHEN 'demo broker' THEN '{"adapter":null,"isDemo":true}'::jsonb
		WHEN 'dime' THEN '{"supportsMultipleCurrencyWallets":true,"supportsMultipleWalletsPerCurrency":true}'::jsonb
		WHEN 'webull thailand' THEN '{"supportsMultipleCurrencyWallets":true,"supportsMultipleWalletsPerCurrency":true}'::jsonb
		ELSE '{"adapter":null}'::jsonb
	END
FROM "accounts"
GROUP BY lower(btrim("broker"));
--> statement-breakpoint
INSERT INTO "brokers" ("code", "display_name", "metadata") VALUES
	('DIME', 'Dime', '{"supportsMultipleCurrencyWallets":true,"supportsMultipleWalletsPerCurrency":true}'::jsonb),
	('WEBULL_TH', 'Webull Thailand', '{"supportsMultipleCurrencyWallets":true,"supportsMultipleWalletsPerCurrency":true}'::jsonb)
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
UPDATE "accounts" AS account
SET "broker_id" = broker."id",
	"is_demo" = lower(btrim(account."name")) = 'demo brokerage'
		AND lower(btrim(account."broker")) = 'demo broker'
		AND EXISTS (
			SELECT 1 FROM "users" AS demo_user
			WHERE demo_user."id" = account."user_id"
				AND lower(btrim(demo_user."email")) = 'demo@investment.local'
		)
FROM "brokers" AS broker
WHERE broker."code" = CASE lower(btrim(account."broker"))
	WHEN 'demo broker' THEN 'DEMO'
	WHEN 'dime' THEN 'DIME'
	WHEN 'webull thailand' THEN 'WEBULL_TH'
	ELSE 'LEGACY_' || upper(md5(lower(btrim(account."broker"))))
END;
--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "broker_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_broker_id_brokers_id_fk"
	FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "accounts_broker_id_idx" ON "accounts" USING btree ("broker_id");
--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "broker";
--> statement-breakpoint
CREATE TABLE "account_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"wallet_key" varchar(100) NOT NULL,
	"label" varchar(100) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"external_ref" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_wallets_account_id_accounts_id_fk"
		FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX "account_wallets_account_wallet_key_unique"
	ON "account_wallets" USING btree ("account_id", "wallet_key");
--> statement-breakpoint
CREATE UNIQUE INDEX "account_wallets_account_id_id_unique"
	ON "account_wallets" USING btree ("account_id", "id");
--> statement-breakpoint
CREATE UNIQUE INDEX "account_wallets_account_external_ref_unique"
	ON "account_wallets" USING btree ("account_id", "external_ref")
	WHERE "external_ref" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "account_wallets_account_id_idx"
	ON "account_wallets" USING btree ("account_id");
--> statement-breakpoint
CREATE INDEX "account_wallets_account_currency_idx"
	ON "account_wallets" USING btree ("account_id", "currency");
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "settlement_wallet_id" uuid;
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_settlement_wallet_account_fk"
	FOREIGN KEY ("account_id", "settlement_wallet_id")
	REFERENCES "public"."account_wallets"("account_id", "id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "transactions_settlement_wallet_id_idx"
	ON "transactions" USING btree ("settlement_wallet_id");
--> statement-breakpoint
ALTER TABLE "fx_transactions" ADD COLUMN "from_wallet_id" uuid;
--> statement-breakpoint
ALTER TABLE "fx_transactions" ADD COLUMN "to_wallet_id" uuid;
--> statement-breakpoint
ALTER TABLE "fx_transactions" ADD CONSTRAINT "fx_transactions_from_wallet_account_fk"
	FOREIGN KEY ("account_id", "from_wallet_id")
	REFERENCES "public"."account_wallets"("account_id", "id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "fx_transactions" ADD CONSTRAINT "fx_transactions_to_wallet_account_fk"
	FOREIGN KEY ("account_id", "to_wallet_id")
	REFERENCES "public"."account_wallets"("account_id", "id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "fx_transactions_from_wallet_id_idx"
	ON "fx_transactions" USING btree ("from_wallet_id");
--> statement-breakpoint
CREATE INDEX "fx_transactions_to_wallet_id_idx"
	ON "fx_transactions" USING btree ("to_wallet_id");
