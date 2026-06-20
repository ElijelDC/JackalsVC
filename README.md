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

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@jackalsvc.com | password123 |
| Member | member@jackalsvc.com | password123 |

## Environment variables

Copy `.env` and update for production:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-here"   # Generate with: openssl rand -base64 32
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed sample data |
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
- **Images**: Gallery and product images use placeholders. Upload to [Cloudinary](https://cloudinary.com) or [Uploadthing](https://uploadthing.com) and store URLs in the database.
- **Admin panel**: An admin role exists in the schema — a future `/admin` section can manage content, products, and events.

## License

Private — Jackals Volleyball Club
