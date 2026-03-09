# FluffiePie - Bakery E-Commerce Platform

FluffiePie is a full-stack, modern bakery e-commerce application designed to provide a seamless shopping experience for customers and a comprehensive management suite for store administrators.

## 🚀 Tech Stack

- **Frontend:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui components
- **Animations:** Framer Motion
- **State Management:** Context API (Auth, Cart), React Hooks
- **Backend (BaaS):** Supabase (Postgres Database, Authentication, Edge Functions, Storage)
- **PWA:** Vite PWA Plugin for offline support and mobile installation

## 📁 Project Structure

- `src/components/`: Reusable UI components.
  - `admin/`: Components specific to the admin dashboard (products, orders, homepage designer).
  - `ui/`: Base UI components (shadcn/ui).
- `src/context/`: Global state providers (`AuthContext`, `CartContext`).
- `src/hooks/`: Custom React hooks (`useProducts`, `useStoreConfig`, `useHomepageConfig`, `useCart`).
- `src/pages/`: Main route pages (`Index`, `Shop`, `ProductDetail`, `Checkout`, `AdminPanel`).
- `src/integrations/supabase/`: Auto-generated database types and Supabase client setup.
- `supabase/functions/`: Supabase Edge Functions for server-side logic (e.g., email notifications).

## 🛍️ Core Features

### 1. Storefront (Customer Facing)
- **Dynamic Homepage:** Fully customizable homepage driven by a JSON configuration stored in the database. Features auto-playing carousels, custom banners, text blocks, and image galleries.
- **Product Catalog:** Browse products with filters by category, occasion, and flavor.
- **Product Details:** Rich product pages with multi-image galleries, zoomable lightboxes, weight/variant selection, and stock availability.
- **Shopping Cart & Checkout:** Persistent cart, discount code application, delivery slot selection, and integrated checkout flow.
- **User Accounts:** Profile management, order history, and saved addresses.
- **Progressive Web App (PWA):** Installable on mobile devices with a native-like experience.

### 2. Admin Panel (Management Suite)
Accessed via `/admin` (restricted to users with the `admin` role).
- **Dashboard:** Real-time overview of revenue, orders, and customer metrics.
- **Homepage Designer:** A drag-and-drop, real-time preview builder for the storefront homepage. Admins can add carousels, customize grids, upload images, and manage banners without touching code.
- **Product Management:** Full CRUD operations for products. Supports multiple images (with drag-to-reorder and cropping), variants (weights), stock management, and categorization.
- **Order Management:** Track order statuses, print invoices, manage refunds, and update delivery states. Includes a specialized "Kitchen" view for chefs to track pending cake preparations.
- **Customer Management:** View user profiles and assign customer tags.
- **Settings:** Configure store information, delivery fees, business hours, discount coupons, and email notification toggles.

## 🗄️ Database Schema (Supabase)

Key tables in the Postgres database:
- `profiles`: Extended user data (linked to `auth.users`).
- `user_roles`: Role-based access control (e.g., `admin`, `user`).
- `products`: Product catalog including prices, stock, arrays for tags/occasions, and JSON fields for weights/attributes.
- `orders`: Customer orders, storing cart items (JSON), delivery addresses, and payment status.
- `reviews`: Customer ratings and comments on products.
- `store_config`: Key-value store for global settings (homepage layout, delivery config, contact info).
- `banners`: Promotional banners for carousels.
- `coupons`: Discount codes and usage limits.
- `contact_messages`: Inquiries from the frontend contact form.
- `contact_messages`: Inquiries from the frontend contact form.

## ☁️ Cloud & Edge Functions

The application utilizes **Lovable Cloud** (Supabase underneath) for backend operations. 

Edge Functions (`supabase/functions/`):
- `send-customer-email`: Handles transactional emails (order confirmations, welcome emails).
- `send-order-notification`: Alerts administrators of new orders.

## 🎨 Design System

The app employs a unified design system leveraging Tailwind CSS semantic tokens (HSL format) defined in `index.css` and `tailwind.config.ts`.
Colors adapt to light/dark themes seamlessly. 

Key animations are driven by custom Tailwind keyframes (e.g., `fade-in`, `slide-in-right`) and `framer-motion` for complex interactive transitions like the homepage carousels and product gallery lightboxes.

## 🔒 Security & Access

- Row Level Security (RLS) is strictly enforced across all Supabase tables.
- Admin privileges are verified using a secure Postgres function `has_role(_user_id, 'admin')` which checks the `user_roles` table bypassing client-side spoofing.
- Profiles are auto-created securely via database triggers upon user email confirmation.