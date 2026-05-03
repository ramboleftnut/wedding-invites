@AGENTS.md

# Vows & Co — Project Overview

Digital wedding invitation marketplace. Couples buy templates, customize their event, share a link, and collect RSVPs.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack dev)
- **Language**: TypeScript 5, React 19
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` — no `tailwind.config.js`, configured entirely in `src/app/globals.css`
- **Auth + DB + Storage**: Firebase 12 (client) + Firebase Admin 13 (server-side / SSR)
- **Payments**: Stripe 22 — checkout session + webhook fulfillment
- **Email**: EmailJS (RSVP notifications, browser-side only)

## Key CSS Rule

Tailwind v4 uses CSS cascade layers (`@layer utilities`). Any **unlayered** CSS beats layered utilities regardless of specificity. Always wrap resets and base overrides in `@layer base { }` so Tailwind utilities can override them.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — wraps everything in AuthProvider, imports globals.css
│   ├── page.tsx                # Home page (SSR — fetches templates via firebase-admin)
│   ├── auth/page.tsx           # Login + register (email/password + Google OAuth)
│   ├── dashboard/page.tsx      # User dashboard (events, RSVPs, image upload)
│   ├── admin/page.tsx          # Admin panel (templates, orders, events) — admin role only
│   ├── store/page.tsx          # Template catalog (SSR)
│   ├── store/[id]/page.tsx     # Template detail + purchase flow
│   ├── event/[slug]/page.tsx   # Public invitation page (SSR + client RSVP)
│   └── api/
│       ├── checkout/route.ts           # POST — creates Stripe checkout session
│       └── webhooks/stripe/route.ts    # POST — Stripe webhook → creates Order + WeddingEvent
├── components/
│   ├── ui/                     # Button, Input, LoadingSpinner
│   ├── sections/               # Navbar, Hero, About, TemplateGrid, Footer
│   └── featured-pages/         # DashboardPage, StorePage, AdminPage (full client components)
├── contexts/
│   └── AuthContext.tsx         # Firebase auth state — exposes user, appUser, signIn/Out/Google
├── lib/
│   ├── firebase.ts             # Client Firebase init (lazy singleton)
│   ├── firebase-admin.ts       # Server Firebase Admin init
│   ├── firestore.ts            # Client CRUD — users, templates, orders, events, rsvps
│   ├── firestore-admin.ts      # Server read-only Firestore (used in SSR pages)
│   ├── stripe.ts               # Stripe client + createCheckoutSession helper
│   ├── emailjs.ts              # RSVP email notification (best-effort, non-blocking)
│   └── seed.ts                 # DB seeding utility
├── templates/
│   └── EnvelopeTemplate.tsx    # Animated envelope invitation + RSVP form
└── types/index.ts              # AppUser, Template, Order, WeddingEvent, RSVP, EventData
```

## Firestore Collections

| Collection  | Purpose |
|---|---|
| `users`     | AppUser — id, email, role (`admin` \| `customer`) |
| `templates` | Invitation designs — name, price, previewImage, fieldsSchema, isFree |
| `orders`    | Purchase records — userId, templateId, stripeSessionId, amount |
| `events`    | Wedding invitations — userId, templateId, slug, eventDate, data (EventData) |
| `rsvps`     | Guest responses — eventId, name, email, attending (`yes`\|`no`), message |

## Auth & Roles

- Firebase Auth: email/password + Google OAuth popup
- On register → AppUser doc created in Firestore with `role: 'customer'`
- Admin access: manually set `role: 'admin'` on the Firestore user doc
- `AuthContext` exposes `user` (Firebase User) and `appUser` (Firestore AppUser)

## Payment Flow

1. User hits `POST /api/checkout` → Stripe checkout session created with templateId + userId in metadata
2. Stripe redirects to hosted checkout page
3. On success, Stripe fires `checkout.session.completed` to `POST /api/webhooks/stripe`
4. Webhook creates `Order` doc + blank `WeddingEvent` doc with a generated slug
5. User is redirected to `/dashboard` to customize their event

## Environment Variables

```
# Firebase client (NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Firebase Admin (server only)
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# EmailJS (NEXT_PUBLIC_)
NEXT_PUBLIC_EMAILJS_SERVICE_ID
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Dev Commands

```bash
npm run dev    # Start dev server (Turbopack)
npm run build  # Production build
npm run lint   # ESLint
```

## Firebase Storage Layout

- `templates/preview-{timestamp}` — template preview images
- `events/{eventId}/cover-{timestamp}` — event cover photo
- `events/{eventId}/gallery-{timestamp}-{filename}` — gallery images
