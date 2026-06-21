# Jackals VC — Volleyball Club Website

A full-stack Next.js website for **Jackals Volleyball Club**, featuring training schedules, an events calendar with reminders, membership plans, a photo gallery, and a club shop with cart and checkout.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes |
| Database | SQLite via Prisma ORM 7 |
| Auth | NextAuth.js v5 (credentials) |

## Features

- **Home** — Hero, upcoming events, shop highlights, gallery preview
- **Training** — Weekly session schedule grouped by day
- **Calendar** — Interactive month view with event reminders (requires sign-in)
- **Membership** — Plan comparison and subscription
- **Gallery** — Filterable photo grid by category
- **Shop** — Product catalog, size selection, cart, and checkout
- **Auth** — User registration and login
- **Dashboard** — Membership status, orders, and saved reminders
- **Admin panel** — Browser-based content management (admin users only)

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed sample data (training, events, products, demo users)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Admin panel

Sign in as an admin (`admin@jackalsvc.com`) and click **Admin** in the nav, or go to [http://localhost:3000/admin](http://localhost:3000/admin).

From there you can manage every table — no Prisma Studio required:

| Section | Database table(s) |
|---------|-------------------|
| **Users** | `User` — accounts and roles |
| **Plans** | `MembershipPlan` — pricing and features |
| **Members** | `Membership` — active subscriptions |
| **Weekly training** | `TrainingSession` — recurring schedule; auto-syncs to calendar |
| **Calendar** | `Event` — training occurrences + one-off events |
| **Reminders** | `EventReminder` — member event alerts |
| **Products** | `Product` — shop inventory |
| **Orders** | `Order` / `OrderItem` — shop purchases |
| **Gallery** | `GalleryImage` — photos |
| **Achievements** | `Achievement` — club milestones and titles |
| **Our teams** | `ClubTeam` — squads on the teams page |

### Demo accounts

All demo accounts use password **`password123`**.

| Role | Email |
|------|-------|
| Admin | admin@jackalsvc.com |
| Member | member@jackalsvc.com |
| Member | sarah.jones@jackalsvc.com |
| Member | mike.chen@jackalsvc.com |
| Member | emma.williams@jackalsvc.com |
| Member | james.patel@jackalsvc.com |
| Member | olivia.brown@jackalsvc.com |
| Member | liam.davis@jackalsvc.com |
| Member | sophie.taylor@jackalsvc.com |
| Member | alex.morgan@jackalsvc.com |
| Member | priya.sharma@jackalsvc.com |
| Member | noah.thompson@jackalsvc.com |

Re-run `npm run db:seed` to populate or refresh demo users and sample memberships.

## Environment variables

Copy `.env` and update for production:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-here"   # Generate with: openssl rand -base64 32
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Optional — live Instagram feed on the homepage
INSTAGRAM_USER_ID=""             # Instagram Business/Creator account ID
INSTAGRAM_ACCESS_TOKEN=""        # Long-lived token from Meta Graph API

# Optional — contact form email delivery
CONTACT_EMAIL="thunderjackals@gmail.com"
SMTP_HOST=""                     # e.g. smtp.gmail.com
SMTP_PORT="587"
SMTP_USER=""                     # e.g. thunderjackals@gmail.com
SMTP_PASS=""                     # Gmail app password
SMTP_FROM=""                     # defaults to SMTP_USER
```

### Instagram feed (optional)

To show recent posts from [@jackalsvolleyball](https://www.instagram.com/jackalsvolleyball/) on the homepage:

1. Convert the Instagram account to a **Business** or **Creator** account and link it to a Facebook Page.
2. Create a [Meta Developer](https://developers.facebook.com/) app and add the **Instagram Graph API** product.
3. Generate a long-lived access token with `instagram_basic` and `pages_show_list` permissions.
4. Find your Instagram User ID (via Graph API Explorer: `GET /me/accounts` → page → `instagram_business_account`).
5. Add `INSTAGRAM_USER_ID` and `INSTAGRAM_ACCESS_TOKEN` to `.env` and restart the dev server.

Posts are cached for one hour. Without these variables, the homepage still shows the Instagram profile link but no feed section.

### Contact form (optional)

The contact page sends messages to `thunderjackals@gmail.com`. In development, submissions are logged to the console when SMTP is not configured. For production delivery, add Gmail (or other) SMTP credentials to `.env` and restart the server.

The database lives at **`dev.db` in the project root** (not `prisma/dev.db`). Use `npm run db:studio` to inspect it.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio (uses `dev.db` at project root) |
| `npm run db:reset` | Reset DB and re-seed (dev only) |

## Project structure

```
src/
├── app/
│   ├── (main)/          # Public pages with shared layout
│   └── api/               # REST API routes
├── components/            # UI, layout, feature components
├── generated/prisma/      # Prisma client (auto-generated)
└── lib/                   # Database, auth, utilities
prisma/
├── schema.prisma          # Database models
└── seed.ts                # Sample data
```

## Production notes

- **Database**: Switch `DATABASE_URL` to PostgreSQL for production and update the Prisma datasource provider.
- **Payments**: Checkout currently marks orders as paid directly. Integrate [Stripe](https://stripe.com) for real payments.
- **Images**: Gallery and product images use placeholders. Upload to [Cloudinary](https://cloudinary.com) or [Uploadthing](https://uploadthing.com) and paste the URL in the admin panel.

## License

Private — Jackals Volleyball Club
