# SaaSum IQMart - Deployment Guide

## Pre-Deployment Checklist

✅ Production build passes (41 pages)
✅ All TypeScript errors resolved
✅ Database schema finalized
✅ Environment variables documented
✅ Deployment configurations ready

## Deployment Stack

- **Frontend/Fullstack**: Vercel (Next.js 16.2.6)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: Better Auth
- **Payments**: Razorpay (Sandbox)

## Step 1: Database Setup (Supabase)

1. Create a new Supabase project at https://supabase.com
2. Run database migrations:
   ```bash
   pnpm run db:push
   ```
3. Enable required extensions in Supabase SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

## Step 2: Environment Variables

Create `.env.local` for development and configure in Vercel for production:

```env
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars
BETTER_AUTH_URL=https://your-domain.vercel.app

# Supabase (for storage)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Razorpay (Payments)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option B: Using Git
1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

## Step 4: Post-Deployment

1. **Create Admin User** (via Supabase SQL Editor):
   ```sql
   INSERT INTO "user" (id, name, email, role, profileComplete, createdAt, updatedAt)
   VALUES (
     'admin-001',
     'Admin User',
     'admin@saasum.com',
     'admin',
     true,
     NOW(),
     NOW()
   );
   ```

2. **Create Demo Vendor**:
   ```sql
   INSERT INTO "user" (id, name, email, role, profileComplete, createdAt, updatedAt)
   VALUES (
     'vendor-001',
     'Demo Vendor',
     'vendor@saasum.com',
     'vendor',
     true,
     NOW(),
     NOW()
   );
   ```

3. **Create Demo Buyer**:
   ```sql
   INSERT INTO "user" (id, name, email, role, profileComplete, createdAt, updatedAt)
   VALUES (
     'buyer-001',
     'Demo Buyer',
     'buyer@saasum.com',
     'buyer',
     true,
     NOW(),
     NOW()
   );
   ```

## Demo Credentials

After deployment, use these credentials to test:

### Admin
- **Email**: admin@saasum.com
- **Password**: Admin@123 (set via Better Auth signup)
- **Access**: Full admin panel, vendor approvals, order management

### Vendor
- **Email**: vendor@saasum.com
- **Password**: Vendor@123
- **Access**: Vendor dashboard, product management, orders

### Buyer
- **Email**: buyer@saasum.com
- **Password**: Buyer@123
- **Access**: Shop, cart, orders, wishlist

## Features to Test

1. **Authentication**
   - Sign up / Sign in
   - Role-based access (admin/vendor/buyer)

2. **Shopping Flow**
   - Browse products
   - Add to cart
   - Checkout with Razorpay sandbox
   - View orders

3. **Wishlist**
   - Add/remove products
   - Move to cart

4. **Reviews & Q&A**
   - Add reviews (verified purchase)
   - Ask questions
   - Vendor answers

5. **Invoice PDF**
   - Download invoice
   - Verify all fields

6. **Admin Features**
   - Vendor approvals
   - Order management
   - Refunds

7. **Vendor Features**
   - Product management
   - Order fulfillment
   - Logistics tracking

## Razorpay Sandbox Testing

Use these test credentials:
- **Card Number**: 4111 1111 1111 1111
- **CVV**: 123
- **Expiry**: Any future date
- **OTP**: 123456

## Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
pnpm run build
```

### Database Connection
- Verify DATABASE_URL in Vercel environment variables
- Check Supabase project is active
- Ensure IP whitelist includes Vercel

### Auth Issues
- Verify BETTER_AUTH_SECRET is set (min 32 chars)
- Check BETTER_AUTH_URL matches your domain
- Clear browser cookies and retry

## Performance Optimization

1. Enable Vercel Analytics
2. Configure CDN for images
3. Enable edge functions for auth
4. Set up monitoring (Vercel Analytics + Sentry)

## Security Checklist

- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevented (using Drizzle ORM)
- [ ] XSS protection enabled

## Support

For deployment issues:
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Better Auth: https://better-auth.com/docs