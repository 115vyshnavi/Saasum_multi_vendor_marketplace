CREATE TYPE "public"."shipment_status" AS ENUM('confirmed', 'courier_assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shipment_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"shipmentId" integer NOT NULL,
	"status" text NOT NULL,
	"location" text,
	"remarks" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shipments" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"vendorId" text NOT NULL,
	"courierPartner" text NOT NULL,
	"trackingNumber" text NOT NULL,
	"status" "shipment_status" DEFAULT 'confirmed' NOT NULL,
	"estimatedDelivery" timestamp,
	"actualDelivery" timestamp,
	"currentLocation" text,
	"remarks" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shipments_trackingNumber_unique" UNIQUE("trackingNumber")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipmentId_shipments_id_fk" FOREIGN KEY ("shipmentId") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipments" ADD CONSTRAINT "shipments_vendorId_user_id_fk" FOREIGN KEY ("vendorId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
