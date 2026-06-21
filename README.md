# SaaSum IQMart – Multi Vendor Marketplace

A production-grade multi-vendor e-commerce marketplace built for Summer SaaS 2026.

SaaSum IQMart enables buyers, vendors, and admins to interact in a complete marketplace ecosystem with authentication, product management, payments, orders, analytics, and premium UI.

---

# Features

## Buyer Features

* User Signup / Login
* Browse Products
* Search & Filter Products
* Add to Cart
* Wishlist
* Checkout
* Razorpay Payment Integration
* Order Tracking
* Invoice Download
* Reviews & Ratings
* Product Q&A

## Vendor Features

* Vendor Signup
* Vendor Dashboard
* Product Management
* Inventory Management
* Order Management
* Performance Analytics

## Admin Features

* Admin Dashboard
* Vendor Approval
* Product Monitoring
* Marketplace Insights
* User Management

---

# Tech Stack

## Frontend

* Next.js 15
* TypeScript
* Tailwind CSS
* Shadcn UI
* Framer Motion

## Backend

* Next.js Server Actions
* Better Auth

## Database

* Supabase PostgreSQL
* Drizzle ORM

## Payments

* Razorpay Sandbox

## Deployment

* Vercel
* Supabase

---

# Project Structure

```bash
app/
 ├── admin/
 ├── api/
 ├── buyer/
 ├── brand/
 ├── cart/
 ├── checkout/
 ├── product/
 ├── vendor/
 └── wishlist/

components/
 ├── dashboard/
 ├── home/
 ├── invoice/
 ├── products/
 └── wishlist/

lib/
 ├── auth/
 ├── db/
 ├── email/
 └── utils/
```

---

# Environment Variables

Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

DATABASE_URL=
DIRECT_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

---

# Installation

```bash
git clone <repo-url>
cd SaaSum_multi_vendor_marketplace
pnpm install
```

---

# Run Development Server

```bash
pnpm dev
```

Runs on:

```bash
http://localhost:3000
```

---

# Database Setup

Push schema:

```bash
pnpm drizzle-kit push
```

Seed data:

```bash
npx tsx seed-data.ts
```

---

# Deployment

Frontend → Vercel
Database → Supabase

---

# Build Status

* 41 Pages
* Zero Build Errors
* Production Ready

---

# Developed For

Summer SaaS 2026 Hackathon
