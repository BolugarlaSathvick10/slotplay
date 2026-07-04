# SlotPlay 🏏 — Reserve Your Game

> Real-time sports venue booking for Indian cricket turfs, football grounds, and more.

![SlotPlay Hero](docs/screenshots/hero.png)

---

## Overview

SlotPlay replaces WhatsApp/phone-based venue bookings with a modern web platform. Players can browse venues, view real-time slot availability, book slots, pay via UPI, and receive digital QR tickets — all in under 60 seconds.

---

## Features

### For Players
- 🔍 **Browse venues** by sport, city, and distance
- 📅 **Live slot availability** — auto-refreshes every 60 seconds
- 💳 **UPI payment** — pay via any UPI app, upload screenshot
- 🎫 **Digital QR ticket** — scan at venue entry
- ⭐ **Reviews** — only from verified bookings
- 📱 **Fully responsive** — works on mobile

### For Venue Owners
- 🏟️ **List venues** — multi-step form with sports, amenities, pricing
- 📸 **Photo management** — upload, reorder, set primary image
- ⏰ **Bulk slot generation** — generate weeks of slots in one click
- ✅ **Payment verification** — approve/reject with UTR and screenshot
- 📊 **Dashboard** — stats, pending verifications, recent bookings

### For Admins
- 👥 **User management** — search, change roles, verify accounts
- 🏟️ **Venue control** — activate/deactivate venues
- 📊 **Analytics** — booking and revenue stats

---

## Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend    | Node.js, Express.js, TypeScript |
| Database   | Neon PostgreSQL (serverless)  |
| Auth       | Session-based (express-session + bcrypt) |
| Email      | Resend API                    |
| Maps       | OpenStreetMap + iframe embed  |
| Storage    | Local disk (Cloudinary adapter ready) |
| Payments   | Manual UPI v1 (screenshot + UTR) |
| Hosting    | Vercel (frontend) + Railway (backend) |

---

## Folder Structure

```
slotplay/
├── slotplay-backend/
│   ├── migrations/          # SQL schema
│   ├── seeders/             # Demo data
│   └── src/
│       ├── config/          # env, database, session, logger
│       ├── controllers/     # HTTP layer (thin)
│       ├── middleware/       # auth, upload, rate limiter, validate
│       ├── models/          # Sequelize models + associations
│       ├── routes/          # Express routers
│       ├── services/        # Business logic
│       │   ├── auth/
│       │   ├── booking/
│       │   ├── email/
│       │   ├── notification/
│       │   ├── review/
│       │   ├── slot/
│       │   ├── storage/     # StorageAdapter + LocalAdapter
│       │   └── venue/
│       ├── types/           # Shared TypeScript types + enums
│       └── utils/           # AppError, apiResponse, helpers
│
└── slotplay-frontend/
    ├── public/
    └── src/
        ├── app/
        │   ├── (auth)/      # login, register, verify-otp, reset-password
        │   ├── (main)/      # homepage, venues, bookings
        │   └── (dashboard)/ # user dashboard, owner, admin
        ├── components/
        │   ├── booking/     # AvailabilityCalendar
        │   ├── layout/      # Navbar, Footer, NotificationBell
        │   ├── turf/        # ImageGallery, AmenitiesList, ReviewsSection
        │   ├── ui/          # Skeleton, EmptyState, LoadingSpinner
        │   └── venue/       # VenueCard, SlotGrid, ReviewsList
        ├── hooks/           # useAuth, useVenue, useBooking
        ├── lib/             # api, auth, venue, booking
        ├── store/           # authStore (Zustand)
        └── types/           # Frontend types
```

---

## Installation

### Prerequisites
- Node.js 20+
- npm 10+
- Neon PostgreSQL account (free at neon.tech)
- Resend account (free tier)

### 1. Clone & install

```bash
git clone https://github.com/your-org/slotplay.git
cd slotplay

# Backend
cd slotplay-backend && npm install

# Frontend
cd ../slotplay-frontend && npm install
```

### 2. Set up database

Run the migration in your Neon SQL Editor:

```bash
# Copy contents of slotplay-backend/migrations/001_initial_schema.sql
# Paste and run in Neon → SQL Editor
```

### 3. Configure environment

**Backend** (`slotplay-backend/.env`):

```env
NODE_ENV=development
PORT=4000

# Neon PostgreSQL
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# Session
SESSION_SECRET=your-64-char-random-secret

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxx
EMAIL_FROM=SlotPlay <onboarding@resend.dev>

# Storage
STORAGE_ADAPTER=local
UPLOADS_DIR=uploads

# Upload limits
MAX_FILE_SIZE_MB=5
```

**Frontend** (`slotplay-frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4. Seed demo data

```bash
cd slotplay-backend
npm run seed
```

Credentials after seed:

| Role   | Email                | Password    |
|--------|----------------------|-------------|
| Admin  | admin@slotplay.in    | Admin@123!  |
| Owner  | ravi@slotplay.in     | Owner@123!  |
| Owner  | priya@slotplay.in    | Owner@123!  |
| Player | arjun@example.com    | Player@123! |

### 5. Run locally

```bash
# Terminal 1 — Backend
cd slotplay-backend && npm run dev   # → localhost:4000

# Terminal 2 — Frontend
cd slotplay-frontend && npm run dev  # → localhost:3000
```

---

## API Reference

| Method | Route                              | Auth    | Description                    |
|--------|------------------------------------|---------|--------------------------------|
| POST   | /api/auth/register                 | None    | Register new user              |
| POST   | /api/auth/login                    | None    | Login, set session             |
| GET    | /api/venues                        | None    | List/filter venues             |
| GET    | /api/venues/:id                    | None    | Venue detail                   |
| GET    | /api/venues/:id/slots?date=        | None    | Slot availability              |
| POST   | /api/bookings                      | User    | Create booking                 |
| POST   | /api/bookings/:id/payment          | User    | Submit UPI payment             |
| POST   | /api/bookings/:id/verify           | Owner   | Verify/reject payment          |
| GET    | /api/owner/venues                  | Owner   | Owner's venues                 |
| POST   | /api/owner/slots/generate          | Owner   | Bulk generate slots            |
| POST   | /api/venues/:id/images             | Owner   | Upload venue images            |
| GET    | /api/notifications                 | User    | Notification list              |

Full API documentation: see `docs/api.md`

---

## Deployment

### Frontend → Vercel

```bash
cd slotplay-frontend
npx vercel --prod
```

Set environment variables in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Backend → Railway

1. Create new Railway project
2. Connect GitHub repo
3. Set root directory: `slotplay-backend`
4. Add environment variables (same as `.env`)
5. Deploy

### Database → Neon

Already configured. Ensure `DATABASE_URL` points to production Neon instance.

---

## Production Checklist

- [ ] Rotate `SESSION_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Configure custom email domain in Resend (`noreply@yourdomain.com`)
- [ ] Run migration on production Neon database
- [ ] Run `npm run seed` once on production for demo data
- [ ] Configure Vercel domain
- [ ] Enable HTTPS (automatic on Vercel + Railway)
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Test full booking flow end-to-end
- [ ] Verify email delivery
- [ ] Test image uploads

---

## Demo Accounts

After running `npm run seed`:

| Role        | Email                | Password    | Access              |
|-------------|----------------------|-------------|---------------------|
| Admin       | admin@slotplay.in    | Admin@123!  | All pages           |
| Venue Owner | ravi@slotplay.in     | Owner@123!  | Owner dashboard     |
| Venue Owner | priya@slotplay.in    | Owner@123!  | Owner dashboard     |
| Player      | arjun@example.com    | Player@123! | Book slots          |

---

## Future Improvements

- [ ] Razorpay integration (currently UPI screenshot)
- [ ] WhatsApp notifications via Twilio
- [ ] Real-time slot updates via WebSockets
- [ ] Google Maps integration for precise location
- [ ] Native iOS/Android app (React Native)
- [ ] Recurring bookings (weekly team slots)
- [ ] Refund management
- [ ] Revenue analytics for owners
- [ ] Multi-language support (Hindi, Telugu, Tamil)

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built with ❤️ for Indian sports enthusiasts.*
