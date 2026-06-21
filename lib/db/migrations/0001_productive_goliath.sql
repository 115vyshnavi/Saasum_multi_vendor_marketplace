CREATE TABLE IF NOT EXISTS "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"discountType" text NOT NULL,
	"discountValue" numeric(10, 2) NOT NULL,
	"minOrderValue" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"expiryDate" timestamp,
	"usageLimit" integer,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"couponType" text DEFAULT 'platform' NOT NULL,
	"vendorId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendorId" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"commissionAmount" numeric(10, 2) NOT NULL,
	"refundAmount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"transactionId" text,
	"remarks" text,
	"payoutDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"userId" text NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"images" text[],
	"status" text DEFAULT 'requested' NOT NULL,
	"refundMethod" text,
	"rejectionReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "returns_orderId_unique" UNIQUE("orderId")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "payoutId" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoiceStatus" text DEFAULT 'generated' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "appliedCoupon" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discountAmount" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand" text;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "commissionRate" numeric(5, 2) DEFAULT '10.00' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payouts" ADD CONSTRAINT "payouts_vendorId_user_id_fk" FOREIGN KEY ("vendorId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "returns" ADD CONSTRAINT "returns_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "returns" ADD CONSTRAINT "returns_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_payoutId_payouts_id_fk" FOREIGN KEY ("payoutId") REFERENCES "public"."payouts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
