import { boolean, decimal, integer, pgEnum, pgTable, serial, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"

// ---------------------------------------------------------------------------
// Better Auth tables. Column names are camelCase to match Better Auth's
// defaults — do not rename them.
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  // App-specific fields on the user record:
  role: text("role").notNull().default("buyer"),
  profileComplete: boolean("profileComplete").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const profile = pgTable("profile", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const productStatus = pgEnum("product_status", ["draft", "active", "pending", "rejected"])
export const orderStatus = pgEnum("order_status", ["placed", "confirmed", "shipped", "delivered", "cancelled", "returned"])
export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"])
export const addressType = pgEnum("address_type", ["home", "office", "other"])
export const vendorApprovalStatus = pgEnum("vendor_approval_status", ["pending", "approved", "rejected", "suspended"])
export const shipmentStatus = pgEnum("shipment_status", ["confirmed", "courier_assigned", "picked_up", "in_transit", "out_for_delivery", "delivered"])

// ---------------------------------------------------------------------------
// E-commerce tables
// ---------------------------------------------------------------------------

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const vendorProfiles = pgTable("vendor_profiles", {
  id: serial("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  
  // Business details
  businessName: text("businessName").notNull(),
  gstNumber: text("gstNumber").unique(),
  panNumber: text("panNumber"),
  businessType: text("businessType"),
  
  // Business address
  businessAddress: text("businessAddress").notNull(),
  businessCity: text("businessCity").notNull(),
  businessState: text("businessState").notNull(),
  businessPincode: text("businessPincode").notNull(),
  
  // Bank details
  bankAccountNumber: text("bankAccountNumber"),
  bankIfscCode: text("bankIfscCode"),
  bankName: text("bankName"),
  accountHolderName: text("accountHolderName"),
  
  // Store details
  storeName: text("storeName").notNull(),
  storeDescription: text("storeDescription"),
  storeLogo: text("storeLogo"),
  storeBanner: text("storeBanner"),
  
  // Approval workflow
  approvalStatus: vendorApprovalStatus("approvalStatus").notNull().default("pending"),
  rejectionReason: text("rejectionReason"),
  approvedAt: timestamp("approvedAt"),
  approvedBy: text("approvedBy").references(() => user.id),
  
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull().default("10.00"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("shortDescription"),
  
  // Pricing
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compareAtPrice", { precision: 10, scale: 2 }),
  
  // Inventory
  stock: integer("stock").notNull().default(0),
  sku: text("sku").notNull().unique(),
  
  // Rating fields (for future reviews module)
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviewCount: integer("reviewCount").notNull().default(0),
  
  // Media (MVP approach with text array)
  images: text("images").array(),
  brand: text("brand"),
  
  // Relationships
  categoryId: integer("categoryId")
    .notNull()
    .references(() => categories.id),
  vendorId: text("vendorId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  // Status & Admin control
  status: productStatus("status").notNull().default("draft"),
  isActive: boolean("isActive").notNull().default(true),
  
  // SEO & metadata
  metaTitle: text("metaTitle"),
  metaDescription: text("metaDescription"),
  
  // Timestamps
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  publishedAt: timestamp("publishedAt"),
})

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  // Address fields
  name: text("name").notNull(), // "Home", "Office"
  phone: text("phone").notNull(),
  addressLine1: text("addressLine1").notNull(),
  addressLine2: text("addressLine2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  country: text("country").notNull().default("India"),
  
  // Address type & status
  isDefault: boolean("isDefault").notNull().default(false),
  type: addressType("type").notNull().default("home"),
  
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const cart = pgTable("cart", {
  id: serial("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  
  // No subtotal/totalItems - calculated dynamically
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cartId")
    .notNull()
    .references(() => cart.id, { onDelete: "cascade" }),
  productId: uuid("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  
  quantity: integer("quantity").notNull().default(1),
  
  // Price snapshot (in case product price changes)
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  // Prevent duplicate products in same cart
  uniqueCartProduct: unique().on(table.cartId, table.productId),
}))

export const orders = pgTable("orders", {
  id: text("id").primaryKey(), // "ORD-2024-001234"
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  // Order totals
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shippingCost", { precision: 10, scale: 2 }).notNull().default("0"),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).notNull().default("0"),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  
  // Order status
  status: orderStatus("status").notNull().default("placed"),
  
  // Enhanced tracking timestamps
  placedAt: timestamp("placedAt").notNull().defaultNow(),
  estimatedDelivery: timestamp("estimatedDelivery"),
  deliveredAt: timestamp("deliveredAt"),
  cancelledAt: timestamp("cancelledAt"),
  
  // Shipping address (snapshot)
  shippingName: text("shippingName").notNull(),
  shippingPhone: text("shippingPhone").notNull(),
  shippingAddress: text("shippingAddress").notNull(),
  shippingCity: text("shippingCity").notNull(),
  shippingState: text("shippingState").notNull(),
  shippingPincode: text("shippingPincode").notNull(),
  
  // Payment info
  paymentStatus: paymentStatus("paymentStatus").notNull().default("pending"),
  paymentMethod: text("paymentMethod"),
  paymentId: text("paymentId"),
  
  // Tracking
  trackingNumber: text("trackingNumber"),
  
  invoiceStatus: text("invoiceStatus").notNull().default("generated"),
  appliedCoupon: text("appliedCoupon"),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: text("orderId")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("productId")
    .notNull()
    .references(() => products.id),
  vendorId: text("vendorId")
    .notNull()
    .references(() => user.id),
  
  // Product snapshot (in case product changes)
  productName: text("productName").notNull(),
  productImage: text("productImage"),
  productSku: text("productSku").notNull(),
  
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  
  // Item-level status (for multi-vendor)
  status: orderStatus("status").notNull().default("placed"),
  
  payoutId: integer("payoutId").references(() => payouts.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  orderId: text("orderId")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  description: text("description"),
  images: text("images").array(),
  status: text("status").notNull().default("requested"),
  refundMethod: text("refundMethod"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discountType").notNull(), // "percentage" | "fixed"
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  minOrderValue: decimal("minOrderValue", { precision: 10, scale: 2 }).notNull().default("0.00"),
  expiryDate: timestamp("expiryDate"),
  usageLimit: integer("usageLimit"),
  usageCount: integer("usageCount").notNull().default(0),
  couponType: text("couponType").notNull().default("platform"), // "platform" | "vendor"
  vendorId: text("vendorId"), // nullable, references user.id
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  vendorId: text("vendorId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }).notNull(),
  refundAmount: decimal("refundAmount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  status: text("status").notNull().default("pending"), // "pending" | "processing" | "paid" | "failed"
  transactionId: text("transactionId"),
  remarks: text("remarks"),
  payoutDate: timestamp("payoutDate"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const shipments = pgTable("shipments", {
  id: serial("id").primaryKey(),
  orderId: text("orderId")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  vendorId: text("vendorId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  courierPartner: text("courierPartner").notNull(), // "Delhivery" | "BlueDart" | "Ekart" | "DTDC"
  trackingNumber: text("trackingNumber").notNull().unique(),
  status: shipmentStatus("status").notNull().default("confirmed"),
  estimatedDelivery: timestamp("estimatedDelivery"),
  actualDelivery: timestamp("actualDelivery"),
  currentLocation: text("currentLocation"),
  remarks: text("remarks"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const shipmentEvents = pgTable("shipment_events", {
  id: serial("id").primaryKey(),
  shipmentId: integer("shipmentId")
    .notNull()
    .references(() => shipments.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  location: text("location"),
  remarks: text("remarks"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  productId: uuid("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => ({
  // Prevent duplicate wishlist items for same user/product
  uniqueUserProduct: unique().on(table.userId, table.productId),
}))

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: uuid("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title").notNull(),
  reviewText: text("reviewText").notNull(),
  images: text("images").array(), // Optional review images
  verifiedPurchase: boolean("verifiedPurchase").notNull().default(false),
  helpfulCount: integer("helpfulCount").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const productQuestions = pgTable("product_questions", {
  id: serial("id").primaryKey(),
  productId: uuid("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer"), // null until answered
  answeredBy: text("answeredBy"), // vendor or admin user ID
  answeredAt: timestamp("answeredAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// Type exports for use in application
// ---------------------------------------------------------------------------

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert

export type Profile = typeof profile.$inferSelect
export type NewProfile = typeof profile.$inferInsert

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

export type VendorProfile = typeof vendorProfiles.$inferSelect
export type NewVendorProfile = typeof vendorProfiles.$inferInsert

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

export type Address = typeof addresses.$inferSelect
export type NewAddress = typeof addresses.$inferInsert

export type Cart = typeof cart.$inferSelect
export type NewCart = typeof cart.$inferInsert

export type CartItem = typeof cartItems.$inferSelect
export type NewCartItem = typeof cartItems.$inferInsert

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert

export type Return = typeof returns.$inferSelect
export type NewReturn = typeof returns.$inferInsert

export type Coupon = typeof coupons.$inferSelect
export type NewCoupon = typeof coupons.$inferInsert

export type Payout = typeof payouts.$inferSelect
export type NewPayout = typeof payouts.$inferInsert

export type Wishlist = typeof wishlist.$inferSelect
export type NewWishlist = typeof wishlist.$inferInsert

export type Review = typeof reviews.$inferSelect
export type NewReview = typeof reviews.$inferInsert

export type ProductQuestion = typeof productQuestions.$inferSelect
export type NewProductQuestion = typeof productQuestions.$inferInsert
