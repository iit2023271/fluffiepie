# FluffiePie - Complete Technical Documentation

> A full-stack bakery e-commerce platform built with React, TypeScript, and Supabase

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Architecture](#project-architecture)
4. [File Structure](#file-structure)
5. [Application Routes](#application-routes)
6. [Authentication System](#authentication-system)
7. [Role-Based Access Control](#role-based-access-control)
8. [Database Schema](#database-schema)
9. [Row Level Security Policies](#row-level-security-policies)
10. [Database Functions & Triggers](#database-functions--triggers)
11. [State Management](#state-management)
12. [Custom Hooks Reference](#custom-hooks-reference)
13. [Component Library](#component-library)
14. [Admin Panel Modules](#admin-panel-modules)
15. [Homepage Designer System](#homepage-designer-system)
16. [Product Management](#product-management)
17. [Order Lifecycle](#order-lifecycle)
18. [Shopping Cart System](#shopping-cart-system)
19. [Checkout Flow](#checkout-flow)
20. [Coupon & Discount System](#coupon--discount-system)
21. [Review System](#review-system)
22. [Wishlist Feature](#wishlist-feature)
23. [Search & Filtering](#search--filtering)
24. [Edge Functions](#edge-functions)
25. [Storage Buckets](#storage-buckets)
26. [Email Notifications](#email-notifications)
27. [Theme System](#theme-system)
28. [PWA Configuration](#pwa-configuration)
29. [SEO Implementation](#seo-implementation)
30. [Design System & Tokens](#design-system--tokens)
31. [Animation System](#animation-system)
32. [Environment Variables](#environment-variables)
33. [Deployment](#deployment)
34. [Security Considerations](#security-considerations)

---

## Overview

**FluffiePie** is a production-ready bakery e-commerce platform designed to provide:

- **For Customers**: A beautiful, responsive shopping experience with product browsing, cart management, order placement, and account features
- **For Administrators**: A comprehensive management suite including dashboards, product CRUD, order tracking, homepage customization, and analytics

The platform is built as a **Progressive Web App (PWA)**, enabling installation on mobile devices with offline asset caching.

**Live URLs**:
- Preview: `https://id-preview--2b956cae-0477-4767-a843-fc25557da6e9.lovable.app`
- Production: `https://fluffiepie.lovable.app`

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.x | UI Framework |
| TypeScript | 5.8.x | Type Safety |
| Vite | 5.4.x | Build Tool & Dev Server |
| Tailwind CSS | 3.4.x | Utility-First Styling |
| shadcn/ui | Latest | Component Library |
| Framer Motion | 12.x | Animations |
| React Router | 6.30.x | Client-Side Routing |
| TanStack Query | 5.x | Server State Management |
| React Hook Form | 7.x | Form Management |
| Zod | 3.x | Schema Validation |
| Recharts | 2.x | Charts & Analytics |

### Backend (Lovable Cloud / Supabase)
| Service | Purpose |
|---------|---------|
| PostgreSQL | Relational Database |
| Supabase Auth | User Authentication |
| Supabase Storage | File Storage (Images) |
| Edge Functions | Serverless Backend Logic |
| Row Level Security | Data Access Control |

### Additional Libraries
- `date-fns` - Date manipulation
- `lucide-react` - Icon library
- `sonner` - Toast notifications
- `vaul` - Drawer component
- `embla-carousel-react` - Carousels
- `react-easy-crop` - Image cropping
- `react-day-picker` - Date picker

---

## Project Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  Pages          │  Components      │  Hooks           │ Context │
│  - Index        │  - Navbar        │  - useProducts   │ - Auth  │
│  - Shop         │  - ProductCard   │  - useStoreInfo  │ - Cart  │
│  - ProductDetail│  - CartDrawer    │  - useHomepage   │         │
│  - Checkout     │  - Admin/*       │  - useWishlist   │         │
│  - Dashboard    │  - UI/*          │  - useDelivery   │         │
│  - AdminPanel   │                  │  - useSEO        │         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE CLIENT SDK                          │
│              @supabase/supabase-js + Auto-gen Types             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LOVABLE CLOUD (Supabase)                    │
├──────────────┬──────────────┬─────────────────┬─────────────────┤
│   Postgres   │  Auth        │  Storage        │  Edge Functions │
│   Database   │  (Email,     │  - product-     │  - send-email   │
│   + RLS      │   OAuth)     │    images       │  - order-notify │
│              │              │  - homepage-    │                 │
│              │              │    assets       │                 │
└──────────────┴──────────────┴─────────────────┴─────────────────┘
```

---

## File Structure

```
fluffiepie/
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   ├── pwa-192x192.png          # PWA icon
│   ├── pwa-512x512.png          # PWA icon
│   └── robots.txt
│
├── src/
│   ├── assets/                   # Static images
│   │   ├── hero-cake.jpg
│   │   ├── category-*.jpg
│   │   └── product-*.jpg
│   │
│   ├── components/
│   │   ├── admin/                # Admin panel components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminProducts.tsx
│   │   │   ├── AdminOrders.tsx
│   │   │   ├── AdminUsers.tsx
│   │   │   ├── AdminSettings.tsx
│   │   │   ├── AdminHomepage.tsx
│   │   │   ├── AdminKitchen.tsx
│   │   │   ├── AdminReviews.tsx
│   │   │   ├── AdminThemes.tsx
│   │   │   ├── AdminMessages.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── ImageCropper.tsx
│   │   │
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (40+ components)
│   │   │
│   │   ├── CartDrawer.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   ├── NavLink.tsx
│   │   ├── Pagination.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductReviews.tsx
│   │   ├── RecentlyViewed.tsx
│   │   ├── ReviewForm.tsx
│   │   ├── SavedAddresses.tsx
│   │   ├── SearchOverlay.tsx
│   │   ├── ShareButtons.tsx
│   │   └── ThemeProvider.tsx
│   │
│   ├── context/
│   │   ├── AuthContext.tsx       # Authentication state
│   │   └── CartContext.tsx       # Shopping cart state
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx        # Responsive detection
│   │   ├── use-toast.ts          # Toast notifications
│   │   ├── useDeliveryConfig.ts  # Delivery settings
│   │   ├── useHomepageConfig.ts  # Homepage JSON config
│   │   ├── useProducts.ts        # Product data fetching
│   │   ├── useRecentlyViewed.ts  # Recently viewed products
│   │   ├── useSEO.ts             # SEO meta tags
│   │   ├── useStoreConfig.ts     # Store configuration
│   │   ├── useStoreInfo.ts       # Store contact info
│   │   ├── useThemeConfig.ts     # Theme settings
│   │   └── useWishlist.ts        # Wishlist management
│   │
│   ├── integrations/
│   │   ├── lovable/
│   │   │   └── index.ts          # Lovable Cloud auth
│   │   └── supabase/
│   │       ├── client.ts         # Supabase client (auto-gen)
│   │       └── types.ts          # Database types (auto-gen)
│   │
│   ├── lib/
│   │   └── utils.ts              # Utility functions (cn, etc.)
│   │
│   ├── pages/
│   │   ├── Index.tsx             # Homepage
│   │   ├── Shop.tsx              # Product catalog
│   │   ├── ProductDetail.tsx     # Single product view
│   │   ├── Checkout.tsx          # Checkout flow
│   │   ├── Dashboard.tsx         # User dashboard
│   │   ├── AdminPanel.tsx        # Admin panel router
│   │   ├── Login.tsx             # Auth page
│   │   ├── ForgotPassword.tsx    # Password reset request
│   │   ├── ResetPassword.tsx     # Password reset form
│   │   ├── Contact.tsx           # Contact form
│   │   ├── Location.tsx          # Store location
│   │   ├── Social.tsx            # Social links
│   │   ├── Install.tsx           # PWA install guide
│   │   └── NotFound.tsx          # 404 page
│   │
│   ├── test/
│   │   ├── setup.ts
│   │   ├── example.test.ts
│   │   └── checkout-validation.test.ts
│   │
│   ├── utils/
│   │   └── generateInvoice.ts    # PDF invoice generation
│   │
│   ├── App.tsx                   # Root component + routing
│   ├── App.css
│   ├── index.css                 # Tailwind + CSS variables
│   ├── main.tsx                  # Entry point
│   └── vite-env.d.ts
│
├── supabase/
│   ├── config.toml               # Supabase configuration
│   └── functions/
│       ├── send-customer-email/
│       │   └── index.ts
│       └── send-order-notification/
│           └── index.ts
│
├── .env                          # Environment variables
├── components.json               # shadcn/ui config
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Application Routes

| Route | Page Component | Access | Description |
|-------|---------------|--------|-------------|
| `/` | `Index.tsx` | Public | Homepage with dynamic sections |
| `/shop` | `Shop.tsx` | Public | Product catalog with filters |
| `/product/:slug` | `ProductDetail.tsx` | Public | Single product page |
| `/checkout` | `Checkout.tsx` | Authenticated | Order placement flow |
| `/login` | `Login.tsx` | Public | Sign in / Sign up |
| `/forgot-password` | `ForgotPassword.tsx` | Public | Password reset request |
| `/reset-password` | `ResetPassword.tsx` | Public | Password reset form |
| `/dashboard` | `Dashboard.tsx` | Authenticated | User account & orders |
| `/admin` | `AdminPanel.tsx` | Admin Only | Full admin management suite |
| `/contact` | `Contact.tsx` | Public | Contact form |
| `/location` | `Location.tsx` | Public | Store location info |
| `/social` | `Social.tsx` | Public | Social media links |
| `/install` | `Install.tsx` | Public | PWA installation guide |
| `*` | `NotFound.tsx` | Public | 404 page |

---

## Authentication System

### Overview

Authentication is handled by Supabase Auth with email/password and Google OAuth support.

### Auth Context (`src/context/AuthContext.tsx`)

```typescript
interface AuthContextType {
  user: User | null;          // Current Supabase user
  session: Session | null;    // Current session
  loading: boolean;           // Auth state loading
  signOut: () => Promise<void>;
}
```

### Authentication Flow

1. **Sign Up**:
   - User submits email, password, and full name
   - Supabase creates user in `auth.users`
   - Confirmation email sent (auto-confirm disabled by default)
   - Upon email confirmation, `handle_new_user()` trigger creates profile

2. **Sign In**:
   - Email/password authentication via `supabase.auth.signInWithPassword()`
   - Or Google OAuth via `lovable.auth.signInWithOAuth("google")`
   - Session stored in localStorage with auto-refresh

3. **Password Reset**:
   - Request via `supabase.auth.resetPasswordForEmail()`
   - User receives email with reset link
   - Reset form at `/reset-password` updates password

### Profile Creation Trigger

When a user confirms their email, a database trigger automatically creates their profile:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Role-Based Access Control

### Role Enum

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
```

### User Roles Table

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,           -- References auth.users
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
```

### Secure Role Check Function

**CRITICAL**: Roles are checked server-side via a `SECURITY DEFINER` function to prevent client-side spoofing:

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### Client-Side Admin Check

```typescript
// In AdminPanel.tsx
const checkAdmin = async () => {
  const { data } = await supabase.rpc("has_role", { 
    _user_id: user.id, 
    _role: "admin" 
  });
  if (!data) {
    toast.error("Access denied. Admin only.");
    navigate("/");
  }
};
```

---

## Database Schema

### Complete Table Reference

#### `profiles`
Extended user data linked to Supabase Auth.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key |
| user_id | UUID | No | - | Reference to auth.users |
| full_name | TEXT | Yes | NULL | Display name |
| email | TEXT | Yes | NULL | Contact email |
| phone | TEXT | Yes | NULL | Phone number |
| avatar_url | TEXT | Yes | NULL | Profile picture URL |
| created_at | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | `now()` | Last update timestamp |

#### `products`
Product catalog with variants and attributes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key |
| name | TEXT | No | - | Product name |
| slug | TEXT | No | - | URL-friendly identifier |
| description | TEXT | No | `''` | Product description |
| category | TEXT | No | `'Classic'` | Product category |
| flavour | TEXT | No | `'Vanilla'` | Flavor type |
| occasion | TEXT[] | No | `'{}'` | Applicable occasions (array) |
| tags | TEXT[] | No | `'{}'` | Display tags (New, Bestseller, etc.) |
| base_price | INTEGER | No | `0` | Base price in smallest currency unit |
| original_price | INTEGER | Yes | NULL | Original price (for discounts) |
| weights | JSONB | No | `'[]'` | Weight variants with pricing |
| images | TEXT[] | No | `'{}'` | Array of image URLs |
| image_url | TEXT | Yes | NULL | Primary image (legacy) |
| stock_quantity | INTEGER | No | `100` | Current stock |
| low_stock_threshold | INTEGER | No | `10` | Alert threshold |
| rating | NUMERIC | No | `0` | Average rating (auto-calculated) |
| review_count | INTEGER | No | `0` | Number of reviews (auto-calculated) |
| custom_attributes | JSONB | No | `'{}'` | Custom filter attributes |
| sku | TEXT | Yes | NULL | Stock keeping unit |
| is_active | BOOLEAN | No | `true` | Visibility flag |
| is_new | BOOLEAN | No | `false` | "New" badge flag |
| is_bestseller | BOOLEAN | No | `false` | "Bestseller" badge flag |
| created_at | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | `now()` | Last update timestamp |

**Weight Variant Structure**:
```json
[
  { "weight": "500g", "price": 450, "originalPrice": 500 },
  { "weight": "1kg", "price": 850, "originalPrice": 950 }
]
```

#### `orders`
Customer orders with full order details.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key |
| user_id | UUID | No | - | Customer reference |
| items | JSONB | No | - | Cart items snapshot |
| delivery_address | JSONB | No | - | Delivery details |
| subtotal | INTEGER | No | - | Pre-discount total |
| discount | INTEGER | No | `0` | Applied discount |
| delivery_fee | INTEGER | No | `0` | Delivery charge |
| total | INTEGER | No | - | Final total |
| status | TEXT | No | `'placed'` | Order status |
| payment_status | TEXT | No | `'pending'` | Payment status |
| delivery_slot | TEXT | Yes | NULL | Selected delivery time |
| coupon_code | TEXT | Yes | NULL | Applied coupon |
| admin_notes | TEXT | Yes | NULL | Internal notes (legacy) |
| refund_amount | INTEGER | No | `0` | Refund issued |
| refund_reason | TEXT | Yes | NULL | Refund justification |
| refund_status | TEXT | Yes | NULL | Refund state |
| created_at | TIMESTAMPTZ | No | `now()` | Order placed time |
| updated_at | TIMESTAMPTZ | No | `now()` | Last status update |

**Order Status Values**:
- `placed` - Order received
- `confirmed` - Order confirmed by admin
- `preparing` - In kitchen preparation
- `ready` - Ready for delivery/pickup
- `out_for_delivery` - With delivery driver
- `delivered` - Successfully delivered (**FINAL**)
- `cancelled` - Order cancelled (**FINAL**)

#### `order_notes`
Admin notes attached to orders (separate from legacy `admin_notes` column).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key |
| order_id | UUID | No | - | FK to orders |
| admin_user_id | UUID | No | - | Admin who wrote note |
| note | TEXT | No | - | Note content |
| note_type | TEXT | No | `'general'` | Note category |
| created_at | TIMESTAMPTZ | No | `now()` | Timestamp |

#### `reviews`
Product reviews with ratings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key |
| user_id | UUID | No | - | Reviewer reference |
| product_id | UUID | No | - | FK to products |
| order_id | UUID | No | - | FK to orders (must have purchased) |
| rating | INTEGER | No | - | 1-5 star rating |
| title | TEXT | Yes | NULL | Review headline |
| comment | TEXT | Yes | NULL | Review body |
| created_at | TIMESTAMPTZ | No | `now()` | Submission time |

#### `addresses`
Saved delivery addresses.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key |
| user_id | UUID | No | - | Owner reference |
| label | TEXT | No | `'Home'` | Address label |
| full_name | TEXT | No | - | Recipient name |
| phone | TEXT | No | - | Contact number |
| address_line | TEXT | No | - | Street address |
| city | TEXT | No | - | City |
| pincode | TEXT | No | - | Postal code |
| is_default | BOOLEAN | No | `false` | Default selection |
| created_at | TIMESTAMPTZ | No | `now()` | Creation time |

#### `wishlists`
User product wishlists.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key |
| user_id | UUID | No | - | Owner reference |
| product_id | UUID | No | - | FK to products |
| created_at | TIMESTAMPTZ | No | `now()` | Added time |

#### `coupons`
Discount codes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key |
| code | TEXT | No | - | Coupon code (unique) |
| discount_type | TEXT | No | `'percentage'` | `percentage` or `fixed` |
| discount_value | INTEGER | No | `0` | Discount amount |
| max_discount | INTEGER | Yes | NULL | Cap for percentage discounts |
| min_order_amount | INTEGER | No | `0` | Minimum order value |
| usage_limit | INTEGER | Yes | NULL | Max total uses |
| used_count | INTEGER | No | `0` | Current usage count |
| is_active | BOOLEAN | No | `true` | Active flag |
| expires_at | TIMESTAMPTZ | Yes | NULL | Expiration date |
| created_at | TIMESTAMPTZ | No | `now()` | Creation time |

#### `banners`
Homepage promotional banners.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key |
| title | TEXT | No | - | Banner headline |
| subtitle | TEXT | Yes | NULL | Secondary text |
| image_url | TEXT | Yes | NULL | Banner image |
| link_url | TEXT | Yes | NULL | Click destination |
| is_active | BOOLEAN | No | `true` | Visibility flag |
| sort_order | INTEGER | No | `0` | Display order |
| starts_at | TIMESTAMPTZ | Yes | NULL | Start date |
| ends_at | TIMESTAMPTZ | Yes | NULL | End date |
| created_at | TIMESTAMPTZ | No | `now()` | Creation time |

#### `store_config`
Key-value configuration store.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key |
| config_type | TEXT | No | - | Configuration category |
| value | TEXT | No | - | Configuration value (often JSON) |
| is_active | BOOLEAN | No | `true` | Active flag |
| sort_order | INTEGER | No | `0` | Display order |
| created_at | TIMESTAMPTZ | No | `now()` | Creation time |

**Config Types**:
- `category` - Product categories (Birthday, Wedding, etc.)
- `flavour` - Available flavors (Chocolate, Vanilla, etc.)
- `occasion` - Special occasions (Anniversary, Graduation, etc.)
- `filter_section` - Custom filter definitions (JSON)
- `product_tag` - Product tags with colors (JSON)
- `homepage_config` - Homepage layout (JSON)
- `store_info` - Store contact details (JSON)
- `delivery_settings` - Delivery configuration (JSON)
- `email_notification` - Email toggle settings
- `active_theme` - Current theme configuration (JSON)
- `custom_theme_preset` - Saved theme presets (JSON)

#### `contact_messages`
Customer inquiries from contact form.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key |
| user_id | UUID | Yes | NULL | Logged-in user (if any) |
| name | TEXT | No | - | Sender name |
| email | TEXT | No | - | Sender email |
| message | TEXT | No | - | Message content |
| is_read | BOOLEAN | No | `false` | Read status |
| created_at | TIMESTAMPTZ | No | `now()` | Submission time |

#### `customer_tags`
Admin-assigned customer tags for segmentation.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key |
| user_id | UUID | No | - | Customer reference |
| tag | TEXT | No | - | Tag name |
| created_at | TIMESTAMPTZ | No | `now()` | Assignment time |

#### `push_subscriptions`
Web push notification subscriptions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key |
| user_id | UUID | No | - | Subscriber reference |
| endpoint | TEXT | No | - | Push endpoint URL |
| p256dh | TEXT | No | - | Public key |
| auth | TEXT | No | - | Auth secret |
| created_at | TIMESTAMPTZ | No | `now()` | Subscription time |

---

## Row Level Security Policies

All tables have RLS enabled. Key policies:

### Products
```sql
-- Public can view active products
CREATE POLICY "Anyone can view active products" ON products
FOR SELECT USING (is_active = true);

-- Admins have full access
CREATE POLICY "Admins can manage products" ON products
FOR ALL USING (has_role(auth.uid(), 'admin'));
```

### Orders
```sql
-- Users can view their own orders
CREATE POLICY "Users can view their own orders" ON orders
FOR SELECT USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create their own orders" ON orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own placed orders
CREATE POLICY "Users can cancel their own recent orders" ON orders
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'placed')
WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Admins can view and update all orders
CREATE POLICY "Admins can view all orders" ON orders
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders" ON orders
FOR UPDATE USING (has_role(auth.uid(), 'admin'));
```

### Profiles
```sql
-- Users can view and update their own profile
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (has_role(auth.uid(), 'admin'));
```

---

## Database Functions & Triggers

### Stock Decrement Trigger
Automatically adjusts stock when order status changes to/from `delivered`:

```sql
CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS trigger AS $$
DECLARE
  item jsonb;
  _product_id text;
  _quantity int;
BEGIN
  IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
    -- Decrement stock when marked delivered
    IF NEW.status = 'delivered' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'delivered') THEN
      FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
        _product_id := item->>'productId';
        _quantity := COALESCE((item->>'quantity')::int, 1);
        IF _product_id IS NOT NULL THEN
          UPDATE public.products
          SET stock_quantity = GREATEST(stock_quantity - _quantity, 0)
          WHERE id = _product_id::uuid;
        END IF;
      END LOOP;
    END IF;

    -- Restore stock when un-delivered
    IF TG_OP = 'UPDATE' AND OLD.status = 'delivered' AND NEW.status IS DISTINCT FROM 'delivered' THEN
      FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
        _product_id := item->>'productId';
        _quantity := COALESCE((item->>'quantity')::int, 1);
        IF _product_id IS NOT NULL THEN
          UPDATE public.products
          SET stock_quantity = stock_quantity + _quantity
          WHERE id = _product_id::uuid;
        END IF;
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Review Rating Trigger
Automatically updates product rating when reviews change:

```sql
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS trigger AS $$
DECLARE
  _product_id uuid;
  _avg_rating numeric;
  _count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _product_id := OLD.product_id;
  ELSE
    _product_id := NEW.product_id;
  END IF;

  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO _avg_rating, _count
  FROM public.reviews
  WHERE product_id = _product_id;

  UPDATE public.products
  SET rating = ROUND(_avg_rating, 1),
      review_count = _count
  WHERE id = _product_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Rating Validation Trigger
Ensures ratings are between 1-5:

```sql
CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS trigger AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Updated At Trigger
Automatically updates `updated_at` timestamps:

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## State Management

### Cart Context (`src/context/CartContext.tsx`)

Global shopping cart state using React Context + useReducer.

**State Structure**:
```typescript
interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  weight: string;
  price: number;
  message?: string;  // Custom cake message
}
```

**Actions**:
| Action | Description |
|--------|-------------|
| `ADD_ITEM` | Add product to cart |
| `REMOVE_ITEM` | Remove item by index |
| `UPDATE_QUANTITY` | Change item quantity |
| `CLEAR_CART` | Empty the cart |
| `TOGGLE_CART` | Open/close cart drawer |
| `CLOSE_CART` | Close cart drawer |

**Usage**:
```typescript
const { state, dispatch } = useCart();

// Add item
dispatch({ 
  type: "ADD_ITEM", 
  payload: { product, quantity: 1, weight: "1kg", price: 850 } 
});

// Toggle drawer
dispatch({ type: "TOGGLE_CART" });
```

### Auth Context (`src/context/AuthContext.tsx`)

Provides authentication state throughout the app.

```typescript
const { user, session, loading, signOut } = useAuth();
```

---

## Custom Hooks Reference

### `useProducts()`
Fetches all active products from database.

```typescript
const { products, loading, error, refetch } = useProducts();
```

### `useStoreConfig()`
Fetches store configuration items (categories, flavors, occasions, tags).

```typescript
const { 
  categories,      // string[]
  flavours,        // string[]
  occasions,       // string[]
  productTags,     // { name, bgColor, textColor }[]
  filterSections,  // FilterSection[]
  loading, 
  reload 
} = useStoreConfig();
```

### `useHomepageConfig()`
Fetches and parses homepage layout configuration.

```typescript
const { config, loading } = useHomepageConfig();
// config: HomepageConfig with sections, hero, categories, etc.
```

### `useDeliveryConfig()`
Fetches delivery settings (fees, slots, minimum order).

```typescript
const { 
  deliveryFee,       // number
  freeDeliveryAbove, // number
  minOrderAmount,    // number
  deliverySlots,     // string[]
  loading 
} = useDeliveryConfig();
```

### `useStoreInfo()`
Fetches store contact information.

```typescript
const { 
  storeName,
  storePhone,
  storeEmail,
  storeAddress,
  whatsappNumber,
  loading 
} = useStoreInfo();
```

### `useWishlist()`
Manages user's wishlist.

```typescript
const { 
  wishlistIds,           // string[] of product IDs
  isInWishlist,          // (productId) => boolean
  toggleWishlist,        // (productId) => Promise<void>
  loading 
} = useWishlist();
```

### `useRecentlyViewed()`
Tracks recently viewed products (localStorage).

```typescript
const { 
  recentlyViewed,  // Product[]
  addViewed        // (product) => void
} = useRecentlyViewed();
```

### `useSEO()`
Sets document meta tags for SEO.

```typescript
useSEO({
  title: "Product Name - FluffiePie",
  description: "Delicious cake...",
  image: "https://...",
  type: "product",
  jsonLd: { /* structured data */ }
});
```

### `useThemeConfig()`
Loads active theme configuration.

```typescript
const { theme, loading } = useThemeConfig();
```

---

## Component Library

### Admin Components

| Component | File | Description |
|-----------|------|-------------|
| `AdminDashboard` | `AdminDashboard.tsx` | Analytics, charts, KPIs |
| `AdminProducts` | `AdminProducts.tsx` | Product CRUD, image upload |
| `AdminOrders` | `AdminOrders.tsx` | Order management, status updates |
| `AdminUsers` | `AdminUsers.tsx` | Customer list, tagging |
| `AdminSettings` | `AdminSettings.tsx` | Store config, coupons, banners |
| `AdminHomepage` | `AdminHomepage.tsx` | Homepage designer |
| `AdminKitchen` | `AdminKitchen.tsx` | Kitchen prep view |
| `AdminReviews` | `AdminReviews.tsx` | Review moderation |
| `AdminThemes` | `AdminThemes.tsx` | Theme customization |
| `AdminMessages` | `AdminMessages.tsx` | Contact form inbox |
| `ConfirmDialog` | `ConfirmDialog.tsx` | Reusable confirmation modal |
| `ImageCropper` | `ImageCropper.tsx` | Image crop utility |

### Public Components

| Component | File | Description |
|-----------|------|-------------|
| `Navbar` | `Navbar.tsx` | Main navigation bar |
| `Footer` | `Footer.tsx` | Site footer |
| `ProductCard` | `ProductCard.tsx` | Product grid item |
| `CartDrawer` | `CartDrawer.tsx` | Sliding cart panel |
| `SearchOverlay` | `SearchOverlay.tsx` | Full-screen search |
| `ProductReviews` | `ProductReviews.tsx` | Review list + form |
| `ReviewForm` | `ReviewForm.tsx` | Review submission |
| `SavedAddresses` | `SavedAddresses.tsx` | Address management |
| `RecentlyViewed` | `RecentlyViewed.tsx` | Recent products carousel |
| `ShareButtons` | `ShareButtons.tsx` | Social share buttons |
| `Pagination` | `Pagination.tsx` | Page navigation |
| `ThemeProvider` | `ThemeProvider.tsx` | Theme CSS injection |

---

## Admin Panel Modules

### Navigation Structure

The admin panel (`/admin`) has a sidebar with these tabs:

1. **Dashboard** - Revenue charts, order volume, KPIs
2. **Homepage** - Visual homepage builder
3. **Products** - Product catalog management
4. **Orders** - Order processing and tracking
5. **Kitchen** - Kitchen prep checklist (date-based)
6. **Customers** - User management and tagging
7. **Reviews** - Review moderation
8. **Messages** - Contact form inbox
9. **Themes** - Store appearance customization
10. **Settings** - Store configuration

### Dashboard Analytics

**Metrics Displayed**:
- Total Revenue (filtered by date range)
- Order Count
- Average Order Value
- Customer Lifetime Value
- Conversion Rate
- Top Products
- Recent Orders

**Charts**:
- Revenue over time (Area chart)
- Order volume (Bar chart)
- Order status distribution (Pie chart)

**Time Ranges**: 7d, 30d, 90d, 12m, Custom

---

## Homepage Designer System

### Configuration Structure

The homepage is driven by a JSON configuration stored in `store_config` with `config_type = 'homepage_config'`.

```typescript
interface HomepageConfig {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    backgroundImage: string;
  };
  categories: {
    title: string;
    columns: number;
  };
  trending: {
    title: string;
    subtitle: string;
    count: number;
  };
  howItWorks: {
    title: string;
    steps: Array<{ icon: string; title: string; description: string }>;
  };
  reviews: {
    title: string;
    subtitle: string;
  };
  sectionNav: {
    enabled: boolean;
    items: Array<{ id: string; label: string }>;
  };
  footer: {
    tagline: string;
    showSocial: boolean;
    showNewsletter: boolean;
  };
  sections: HomepageSection[];
}

interface HomepageSection {
  id: string;
  visible: boolean;
  label?: string;
  type?: CustomSectionType;
  data?: CustomSectionData;
}
```

### Built-in Section Types

| Section ID | Description |
|------------|-------------|
| `banners` | Hero banner carousel |
| `hero` | Main hero section |
| `categories` | Category grid |
| `trending` | Trending products carousel |
| `howItWorks` | Process steps |
| `reviews` | Customer reviews |
| `sectionNav` | Sticky navigation bar |
| `footer` | Page footer |

### Custom Section Types

| Type | Description |
|------|-------------|
| `text_block` | Rich text content |
| `cta_banner` | Call-to-action banner with image |
| `feature_grid` | Feature cards grid |
| `faq` | FAQ accordion |
| `spacer` | Vertical spacing |
| `image_gallery` | Image grid with lightbox |

---

## Product Management

### Product Creation/Editing

1. **Basic Info**: Name, slug, description, SKU
2. **Categorization**: Category, flavor, occasions (multi-select)
3. **Pricing**: Base price, original price (for discounts)
4. **Weight Variants**: Multiple weights with individual pricing
5. **Images**: Primary image + additional gallery images (drag-to-reorder)
6. **Stock**: Quantity, low stock threshold
7. **Flags**: Active, New, Bestseller
8. **Tags**: Display tags (badges)
9. **Custom Attributes**: Dynamic filter attributes

### Image Upload Flow

1. User selects image file
2. `ImageCropper` component opens for cropping
3. Cropped image uploaded to `product-images` storage bucket
4. Public URL stored in product record

### Weight Variants

Products can have multiple weight options with different prices:

```json
{
  "weights": [
    { "weight": "500g", "price": 450 },
    { "weight": "1kg", "price": 850, "originalPrice": 950 },
    { "weight": "2kg", "price": 1600 }
  ]
}
```

---

## Order Lifecycle

### Status Flow

```
placed → confirmed → preparing → ready → out_for_delivery → delivered
                                                         ↘
                                                          cancelled
```

### Status Descriptions

| Status | Description | Actions |
|--------|-------------|---------|
| `placed` | Customer placed order | Admin: Confirm, Cancel |
| `confirmed` | Admin confirmed order | Admin: Move to preparing |
| `preparing` | Kitchen is making order | Admin: Move to ready |
| `ready` | Ready for pickup/delivery | Admin: Move to out_for_delivery |
| `out_for_delivery` | With delivery driver | Admin: Mark delivered |
| `delivered` | Order complete | **FINAL - No changes allowed** |
| `cancelled` | Order cancelled | **FINAL - No changes allowed** |

### Customer Cancellation

Customers can cancel their own orders if:
1. Status is still `placed`
2. Within the cancellation window (configurable, e.g., 30 minutes)

Cancellation window countdown is displayed on the Dashboard.

### Stock Management

- Stock is **only decremented** when order status changes to `delivered`
- If order is "un-delivered" (status changed from delivered), stock is restored
- Low stock alerts shown in admin when `stock_quantity <= low_stock_threshold`

---

## Shopping Cart System

### Cart Persistence

Cart is persisted in `localStorage` and hydrated on page load.

### Cart Item Structure

```typescript
interface CartItem {
  product: Product;
  quantity: number;
  weight: string;        // Selected weight variant
  price: number;         // Price per unit at selected weight
  message?: string;      // Custom message (for cakes)
}
```

### Cart Operations

| Operation | Action Type | Payload |
|-----------|-------------|---------|
| Add item | `ADD_ITEM` | `{ product, quantity, weight, price, message? }` |
| Remove item | `REMOVE_ITEM` | `{ index }` |
| Update quantity | `UPDATE_QUANTITY` | `{ index, quantity }` |
| Clear cart | `CLEAR_CART` | - |
| Toggle drawer | `TOGGLE_CART` | - |
| Close drawer | `CLOSE_CART` | - |

### Cart Drawer

The `CartDrawer` component is a sliding panel showing:
- Cart items with thumbnails
- Quantity adjusters
- Item removal
- Subtotal calculation
- Checkout button

---

## Checkout Flow

### Steps

1. **Address Selection**
   - Choose from saved addresses
   - Or enter new address

2. **Delivery Slot Selection**
   - Date picker (calendar)
   - Time slot selection

3. **Coupon Application** (optional)
   - Enter code
   - Validate and apply discount

4. **Order Summary**
   - Item list
   - Subtotal
   - Discount
   - Delivery fee
   - Total

5. **Place Order**
   - Creates order in database
   - Opens WhatsApp with order details
   - Clears cart
   - Redirects to dashboard

### Delivery Fee Logic

```typescript
const calculateDeliveryFee = (subtotal: number) => {
  if (subtotal >= freeDeliveryAbove) return 0;
  return deliveryFee;
};
```

### WhatsApp Integration

After order placement, a WhatsApp message is composed with:
- Order ID
- Items list
- Delivery address
- Selected date/time
- Total amount

---

## Coupon & Discount System

### Coupon Types

| Type | Description |
|------|-------------|
| `percentage` | Percentage off (e.g., 10% off) |
| `fixed` | Fixed amount off (e.g., ₹100 off) |

### Validation Rules

1. Coupon must be active (`is_active = true`)
2. Not expired (`expires_at IS NULL OR expires_at > now()`)
3. Usage limit not exceeded (`used_count < usage_limit`)
4. Minimum order amount met (`subtotal >= min_order_amount`)

### Discount Calculation

```typescript
const calculateDiscount = (coupon: Coupon, subtotal: number) => {
  if (coupon.discount_type === 'percentage') {
    const discount = (subtotal * coupon.discount_value) / 100;
    return coupon.max_discount 
      ? Math.min(discount, coupon.max_discount) 
      : discount;
  }
  return coupon.discount_value;
};
```

---

## Review System

### Review Creation

Users can review products they've purchased:

1. Must be logged in
2. Must have an order with that product
3. Rating 1-5 stars (validated by trigger)
4. Optional title and comment

### Product Rating Calculation

Automatically updated by `update_product_rating()` trigger:
- `rating` = Average of all review ratings
- `review_count` = Total number of reviews

### Review Display

`ProductReviews` component shows:
- Average rating with star display
- Review count
- Individual reviews with user info
- Review form (if user has purchased)

---

## Wishlist Feature

### Implementation

```typescript
// useWishlist hook
const { wishlistIds, isInWishlist, toggleWishlist } = useWishlist();

// Check if product is in wishlist
const inWishlist = isInWishlist(product.id);

// Toggle wishlist status
await toggleWishlist(product.id);
```

### Database

Wishlist items stored in `wishlists` table with RLS ensuring users can only manage their own.

---

## Search & Filtering

### Shop Page Filters

1. **Search**: Text search in product name and description
2. **Category**: Single-select category filter
3. **Flavor**: Single-select flavor filter
4. **Occasion**: Multi-select occasion filter
5. **Tags**: Product tag filter
6. **Discount**: Products with discount filter
7. **Custom Attributes**: Dynamic filters from `custom_attributes` JSON

### Filter Logic

```typescript
const filtered = useMemo(() => {
  return products.filter(p => {
    // Text search
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Category filter
    if (selectedFilters.category && p.category !== selectedFilters.category) {
      return false;
    }
    // ... other filters
    return true;
  });
}, [products, searchQuery, selectedFilters]);
```

### Sort Options

- Default (featured)
- Price: Low to High
- Price: High to Low
- Newest First
- Rating

---

## Edge Functions

### `send-customer-email`

Sends transactional emails to customers.

**Location**: `supabase/functions/send-customer-email/index.ts`

**Triggers**:
- Order confirmation
- Order status updates (if enabled)
- Welcome email

**Technology**: Resend API

### `send-order-notification`

Alerts administrators of new orders.

**Location**: `supabase/functions/send-order-notification/index.ts`

**Trigger**: New order creation

---

## Storage Buckets

### `product-images`

- **Purpose**: Product photos
- **Public**: Yes
- **Structure**: Flat (all images at root)

### `homepage-assets`

- **Purpose**: Homepage images (banners, CTA backgrounds)
- **Public**: Yes
- **Structure**: Flat

### Upload Pattern

```typescript
const uploadImage = async (file: File, bucket: string) => {
  const filename = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, file);
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filename);
  
  return publicUrl;
};
```

---

## Email Notifications

### Configuration

Email notifications are toggled in `store_config` with `config_type = 'email_notification'`:

```json
{ "status": "placed", "enabled": true }
{ "status": "confirmed", "enabled": true }
{ "status": "preparing", "enabled": false }
...
```

### Notification Types

| Status | Default | Description |
|--------|---------|-------------|
| `placed` | On | Order received confirmation |
| `confirmed` | On | Order confirmed by store |
| `preparing` | Off | Kitchen started preparation |
| `ready` | Off | Order ready for delivery |
| `out_for_delivery` | On | Driver dispatched |
| `delivered` | On | Delivery confirmation |

---

## Theme System

### Theme Configuration

Themes are stored in `store_config` with `config_type = 'active_theme'`:

```json
{
  "name": "Custom Theme",
  "colors": {
    "primary": "350 45% 55%",
    "secondary": "45 30% 96%",
    "accent": "350 45% 55%",
    "background": "0 0% 100%",
    "foreground": "240 10% 10%",
    "muted": "240 5% 96%",
    "card": "0 0% 100%"
  },
  "announcement": {
    "enabled": true,
    "text": "Free delivery on orders above ₹500!"
  }
}
```

### Theme Application

`ThemeProvider` component injects CSS variables into `:root`:

```typescript
const applyTheme = (theme: ThemeConfig) => {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
};
```

### Preset Themes

Admins can choose from preset themes or create custom ones.

---

## PWA Configuration

### Vite PWA Plugin

```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'FluffiePie Bakery',
    short_name: 'FluffiePie',
    theme_color: '#ffffff',
    icons: [
      { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}']
  }
})
```

### Features

- Installable on mobile devices
- Offline asset caching
- App-like experience
- Home screen icon

---

## SEO Implementation

### useSEO Hook

```typescript
useSEO({
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  jsonLd?: object;
});
```

### Meta Tags Set

- `<title>`
- `<meta name="description">`
- `<meta property="og:title">`
- `<meta property="og:description">`
- `<meta property="og:image">`
- `<meta property="og:type">`
- `<script type="application/ld+json">` (structured data)

### Product JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Chocolate Truffle Cake",
  "description": "Rich chocolate cake...",
  "image": "https://...",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "INR",
    "lowPrice": 450,
    "highPrice": 1600,
    "availability": "https://schema.org/InStock"
  }
}
```

---

## Design System & Tokens

### CSS Variables (`src/index.css`)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 350 45% 55%;
  --primary-foreground: 0 0% 100%;
  --secondary: 45 30% 96%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 350 45% 55%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 350 45% 55%;
  --radius: 0.75rem;
}
```

### Tailwind Config

All CSS variables are mapped in `tailwind.config.ts` for use with utility classes:

```typescript
colors: {
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  // ... etc
}
```

### Usage

```tsx
// Always use semantic classes
<div className="bg-primary text-primary-foreground" />
<div className="bg-card border border-border" />
<div className="text-muted-foreground" />

// Never use raw colors
// ❌ <div className="bg-pink-500" />
// ❌ <div className="text-gray-600" />
```

---

## Animation System

### Framer Motion Variants

Common animation patterns used throughout:

```typescript
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.1 }
  }
};
```

### Tailwind Animations

Custom keyframes in `tailwind.config.ts`:

- `fade-in` - Opacity 0 to 1
- `fade-out` - Opacity 1 to 0
- `slide-in-right` - Slide from right
- `slide-out-right` - Slide to right
- `scale-in` - Scale up with fade
- `accordion-down` - Accordion expand
- `accordion-up` - Accordion collapse

---

## Environment Variables

### Required Variables (Auto-configured)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier |

### Edge Function Secrets

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Supabase URL (for edge functions) |
| `SUPABASE_ANON_KEY` | Anon key (for edge functions) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `RESEND_API_KEY` | Resend email API key |
| `LOVABLE_API_KEY` | Lovable AI gateway key |

---

## Deployment

### Frontend Deployment

Frontend changes require clicking **"Update"** in the publish dialog to go live.

### Backend Deployment

Backend changes deploy **immediately and automatically**:
- Database migrations
- Edge functions
- Storage policies
- RLS policies

### Production URL

Published at: `https://fluffiepie.lovable.app`

---

## Security Considerations

### Row Level Security

All tables have RLS enabled with appropriate policies. Key principles:

1. **Users can only access their own data** (orders, addresses, profiles)
2. **Admins have elevated access** via `has_role()` function
3. **Public data is read-only** (products, reviews)
4. **Write operations require authentication**

### Admin Role Verification

Admin status is **never** checked client-side. Always use the server-side `has_role()` function:

```typescript
const { data: isAdmin } = await supabase.rpc("has_role", {
  _user_id: user.id,
  _role: "admin"
});
```

### Sensitive Operations

- Stock decrements happen via SECURITY DEFINER triggers
- Profile creation happens via SECURITY DEFINER triggers
- Role checks use SECURITY DEFINER functions

### Data Validation

- Rating validation (1-5) enforced at database level
- Required fields enforced by NOT NULL constraints
- Foreign key relationships maintained

---

## API Quick Reference

### Supabase Client

```typescript
import { supabase } from "@/integrations/supabase/client";

// Fetch
const { data, error } = await supabase
  .from("products")
  .select("*")
  .eq("is_active", true);

// Insert
const { error } = await supabase
  .from("orders")
  .insert({ user_id, items, total, ... });

// Update
const { error } = await supabase
  .from("orders")
  .update({ status: "confirmed" })
  .eq("id", orderId);

// Delete
const { error } = await supabase
  .from("addresses")
  .delete()
  .eq("id", addressId);

// RPC
const { data } = await supabase.rpc("has_role", {
  _user_id: userId,
  _role: "admin"
});
```

### Common Queries

```typescript
// Get user orders
const { data: orders } = await supabase
  .from("orders")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

// Get product with reviews
const { data: product } = await supabase
  .from("products")
  .select("*, reviews(*)")
  .eq("slug", slug)
  .single();

// Get store config
const { data: config } = await supabase
  .from("store_config")
  .select("*")
  .eq("config_type", "homepage_config")
  .eq("is_active", true)
  .single();
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Access denied" on admin | Ensure user has `admin` role in `user_roles` table |
| Cart not persisting | Check localStorage is enabled |
| Images not uploading | Verify storage bucket policies |
| Orders not creating | Check RLS policies on orders table |
| Reviews not showing | Ensure reviews are linked to valid product_id |

### Debug Tools

1. **Browser Console**: Check for JavaScript errors
2. **Network Tab**: Inspect Supabase API calls
3. **Supabase Logs**: Check database and auth logs
4. **Edge Function Logs**: Debug serverless functions

---

*Last updated: March 2026*
*Version: 1.0.0*
