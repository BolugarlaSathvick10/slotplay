# SlotPlay 🏏 — Reserve Your Game

> Real-time sports venue booking platform for Indian cricket turfs, football grounds, badminton courts, and multi-sport arenas.

![SlotPlay Hero](docs/screenshots/hero.png)

[![Java 21](https://img.shields.io/badge/Java-21%20LTS-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot 3.3.5](https://img.shields.io/badge/Spring%20Boot-3.3.5-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js 14](https://img.shields.io/badge/Next.js-14%20(App%20Router)-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20Serverless-4169E1?style=flat&logo=postgresql&logoColor=white)](https://neon.tech)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 📖 Overview

SlotPlay replaces fragmented phone calls and WhatsApp chats with a streamlined, real-time sports venue booking system. Players can discover nearby turfs, check live slot availability with sub-minute refreshes, book slots, complete UPI payments, and generate digital QR tickets for contactless entry — all in under 60 seconds.

Venue owners gain automated slot scheduling, revenue tracking, and payment verification tools, while platform administrators have full visibility via a financial analytics dashboard and moderation controls.

---

## ⚡ Core Features

### 🏏 For Players
- 🔍 **Venue Discovery:** Browse and search turfs by sport (Cricket, Football, Badminton, Tennis), city, pricing, and distance.
- 📅 **Live Slot Availability:** Interactive calendar with dynamic slot grids that auto-refresh to reflect real-time bookings.
- 🔒 **Concurrency & Double-Booking Protection:** Guaranteed slot locking with database partial unique constraints preventing race conditions.
- 💳 **UPI Payment Workflow:** Seamless UPI QR and VPA integration; upload payment proof and UTR transaction reference.
- 🎫 **Digital QR Entry Tickets:** Instant QR pass generation rendered on HTML5 canvas with downloadable pass format.
- ⭐ **Verified Community Reviews:** Transparent ratings and reviews submitted exclusively by players with confirmed bookings.
- 🔔 **Interactive Notification Center:** Categorized alerts (bookings, payments, system) with real-time unread badges.

### 🏟️ For Venue Owners
- 🏢 **Venue Management:** Multi-step wizard to configure venues, court dimensions, amenities, rules, and sport categories.
- 📸 **Photo Gallery Controls:** Image upload pipeline with reordering, captioning, and primary display selection.
- ⏰ **Bulk Slot Generation:** Generate recurring daily/weekly slot schedules in seconds with custom pricing and court allocation.
- 📅 **Live Daily Schedule Viewer:** Real-time day-view timetable tracking active slots and booking statuses.
- ✅ **Payment Verification Queue:** Review player payment screenshots, match UTR numbers, and approve or reject with instant notifications.
- 📈 **Owner Analytics Dashboard:** Monitor daily revenue, upcoming bookings, utilization rates, and pending verification queues.

### 🛡️ For Platform Admins
- 📊 **Platform Financial Reports & Analytics (`/admin/reports`):**
  - Interactive **Recharts** visualizations: Revenue trajectories, booking volume trends, status breakdown donut charts, and venue rankings.
  - Live KPI cards: Total Gross Revenue, Total Bookings, Active vs. Suspended Venues, Registered Users, and Pending Approvals.
  - Comprehensive Transaction & Booking Audit Table with search, status filters, and date range filters.
  - **One-click Export:** Export audit data to CSV or print instant PDF financial reports.
- 👥 **User Role & Account Management:** Search platform users, toggle verification statuses, and assign roles (`ROLE_USER`, `ROLE_OWNER`, `ROLE_ADMIN`).
- 🏟️ **Venue Moderation:** Activate, suspend, or inspect venues across all regions to ensure quality and safety compliance.

---

## 🛠️ Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│             SlotPlay Frontend (Next.js 14)             │
│   React 18 · TypeScript · Tailwind CSS · TanStack Query │
│   Framer Motion · Recharts · Lucide Icons · Zustand    │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / REST (slotplay.sid Cookie Auth)
┌──────────────────────────▼─────────────────────────────┐
│          SlotPlay Backend (Java 21 / Spring Boot 3)    │
│   Spring Security · Spring Data JPA · Hibernate        │
│   HikariCP · Flyway Migrations · Springdoc OpenAPI     │
│   Jackson · Resend Email · Local/Cloudinary Storage    │
└──────────────────────────┬─────────────────────────────┘
                           │ JDBC / SQL
┌──────────────────────────▼─────────────────────────────┐
│              Neon PostgreSQL (Serverless)               │
│   Partial Unique Constraints · Pessimistic Locking      │
│   Stale Booking Expiration · ACID Transactions         │
└────────────────────────────────────────────────────────┘
```

| Layer | Technology | Key Capabilities |
|---|---|---|
| **Frontend** | **Next.js 14 (App Router)** | Server & Client Components, Route Groups (`(auth)`, `(main)`, `(dashboard)`), SEO metadata |
| **UI & Styling** | **Tailwind CSS + Framer Motion** | Dark mode, responsive design, micro-animations, glassmorphism |
| **State & Data** | **TanStack Query + Zustand** | Optimistic caching, auto-refetching, global auth state |
| **Data Viz** | **Recharts** | Responsive AreaCharts, BarCharts, and Donut charts for financial metrics |
| **Backend** | **Java 21 LTS + Spring Boot 3.3.5** | High-performance compiled backend, Jakarta Validation, Exception advice |
| **Security** | **Spring Security + BCrypt** | Session cookie (`slotplay.sid`), role-based endpoint access control, CSRF protection |
| **Database** | **PostgreSQL (Neon)** | Serverless Postgres, Flyway database versioning, partial indexes |
| **ORM & Data** | **Spring Data JPA + Hibernate** | HikariCP connection pooling, batch queries eliminating WAN N+1 bottlenecks |
| **API Docs** | **Springdoc OpenAPI (Swagger)** | Auto-generated OpenAPI 3 specification and interactive Swagger UI |
| **Email** | **Resend API** | Transactional booking confirmations, OTP verification, and status updates |
| **Storage** | **Local Disk / Cloudinary** | Pluggable file upload service for venue photos and payment receipts |

---

## 📂 Project Structure

```
slotplay/
├── slotplay-backend-java/             # Enterprise Spring Boot 3 Backend
│   ├── src/main/java/com/slotplay/
│   │   ├── config/                    # Security, CORS, OpenAPI, Storage configuration
│   │   ├── controller/                # REST Controllers (Auth, Venue, Slot, Booking, Admin, Owner, etc.)
│   │   ├── dto/                       # Request/Response DTOs (AdminReportsResponse, ApiResponse, etc.)
│   │   ├── entity/                    # JPA Entities (User, Venue, Slot, Booking, Payment, Review, etc.)
│   │   ├── exception/                 # AppException hierarchy & GlobalExceptionHandler
│   │   ├── repository/                # Spring Data JPA Repositories with custom JPQL queries
│   │   ├── service/                   # Business logic interfaces
│   │   │   └── impl/                  # Service implementations (Venue, Slot, Booking, Email, etc.)
│   │   └── SlotPlayApplication.java   # Spring Boot entry point
│   ├── src/main/resources/
│   │   ├── db/migration/              # Flyway SQL migrations (V1__initial_schema.sql)
│   │   └── application.properties     # Spring Boot application properties
│   ├── src/test/                      # JUnit 5 & MockMvc integration test suite (H2 profile)
│   ├── pom.xml                        # Maven dependencies & build plugins
│   ├── mvnw & mvnw.cmd                # Maven wrapper scripts
│   └── README.md                      # Backend-specific guide
│
└── slotplay-frontend/                 # Next.js 14 App Router Frontend
    ├── public/                        # Static assets, branding, and icons
    └── src/
        ├── app/
        │   ├── (auth)/                # Login, registration, OTP verification, password reset
        │   ├── (main)/                # Public homepage, venue search, venue detail, booking flow
        │   └── (dashboard)/           # Protected dashboards:
        │       ├── dashboard/         # Player profile & booking management
        │       ├── owner/             # Owner venues, slot manager, payment verifications
        │       ├── admin/             # Admin controls & user management
        │       │   └── reports/       # Platform Financial Reports & Analytics dashboard
        │       └── notifications/     # Dedicated Notification Center
        ├── components/
        │   ├── booking/               # AvailabilityCalendar, SlotGrid, UPI payment modal
        │   ├── layout/                # Responsive Navbar, Footer, NotificationBell
        │   ├── turf/                  # ImageGallery, AmenitiesList, ReviewsSection
        │   └── ui/                    # Skeleton loaders, ErrorState, EmptyState, Modals
        ├── hooks/                     # useAuth, useVenue, useBooking, useAdminReports
        ├── lib/                       # Axios API instance, client API services, utility helpers
        ├── store/                     # Zustand stores (authStore)
        └── types/                     # TypeScript interfaces and response payloads
```

---

## 🚀 Getting Started

### Prerequisites
- **Java Development Kit (JDK):** Version 21 LTS installed (`java -version`)
- **Node.js:** Version 20.x or higher (`node -v`) and npm 10+
- **PostgreSQL Database:** Neon Serverless PostgreSQL instance (or local PostgreSQL 15+)
- **Resend Account:** API key for transactional emails (free tier available at resend.com)

---

### 1. Database Setup

Create a PostgreSQL database on [Neon](https://neon.tech) (or locally). Flyway will automatically execute and validate migrations (`V1__initial_schema.sql`) when the Spring Boot backend launches.

Key schema guarantee:
```sql
CREATE UNIQUE INDEX idx_slots_unique_active_booking 
ON bookings (slot_id) 
WHERE status IN ('confirmed', 'pending_verification', 'pending_payment');
```
*This ensures zero slot overlapping or double bookings under concurrent load.*

---

### 2. Backend Configuration & Launch

1. Navigate to the backend directory:
   ```bash
   cd slotplay-backend-java
   ```

2. Configure environment variables in `.env` (or set environment variables):
   ```env
   DATABASE_URL=postgresql://<user>:<password>@<neon-host>/neondb?sslmode=require
   DATABASE_USERNAME=<db-username>
   DATABASE_PASSWORD=<db-password>
   FRONTEND_URL=http://localhost:3000
   PORT=4000
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=SlotPlay <notifications@yourdomain.com>
   STORAGE_ADAPTER=local
   UPLOADS_DIR=uploads
   ```

3. Run the development server using the Maven wrapper:
   - **Linux / macOS:**
     ```bash
     ./mvnw spring-boot:run
     ```
   - **Windows:**
     ```cmd
     .\mvnw.cmd spring-boot:run
     ```

4. Verify backend health and documentation:
   - **Health Check:** [http://localhost:4000/api/health](http://localhost:4000/api/health)
   - **Swagger UI:** [http://localhost:4000/swagger-ui.html](http://localhost:4000/swagger-ui.html)
   - **OpenAPI Schema:** [http://localhost:4000/api-docs](http://localhost:4000/api-docs)

---

### 3. Frontend Configuration & Launch

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd slotplay-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

4. Launch the Next.js development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   - **Web App:** [http://localhost:3000](http://localhost:3000)

---

### 4. Running Automated Tests

- **Backend (JUnit 5 + MockMvc with in-memory H2 database):**
  ```bash
  # In slotplay-backend-java/
  ./mvnw test        # Linux/macOS
  .\mvnw.cmd test    # Windows
  ```
- **Frontend (TypeScript type safety & compilation):**
  ```bash
  # In slotplay-frontend/
  npx tsc --noEmit
  ```

---

## 🔑 Demo Accounts

For local testing and demonstration, you can log in with the following default roles:

| Role | Email | Password | Access & Permissions |
|---|---|---|---|
| **Admin** | `admin@slotplay.in` | `Admin@123!` | System-wide analytics, `/admin/reports`, venue moderation, user management |
| **Venue Owner** | `ravi@slotplay.in` | `Owner@123!` | Owner dashboard, venue creation, bulk slot generator, payment verification |
| **Venue Owner** | `priya@slotplay.in` | `Owner@123!` | Owner dashboard, schedule viewer, venue management |
| **Player** | `arjun@example.com` | `Player@123!` | Public venue search, live slot booking, UPI payment flow, QR tickets |

---

## 📡 REST API Reference

| Domain | Method | Endpoint | Auth / Role | Description |
|---|---|---|---|---|
| **Health** | `GET` | `/api/health` | Public | System status and database connectivity |
| **Auth** | `POST` | `/api/auth/register` | Public | Register a new user |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate user & set session cookie |
| **Auth** | `POST` | `/api/auth/logout` | Authenticated | Destroy session |
| **Auth** | `GET` | `/api/auth/me` | Authenticated | Current authenticated user profile |
| **Venues** | `GET` | `/api/venues` | Public | Search and filter active venues |
| **Venues** | `GET` | `/api/venues/{id}` | Public | Venue details, sports, and images |
| **Slots** | `GET` | `/api/venues/{id}/slots` | Public | Real-time available slots by date |
| **Bookings**| `POST` | `/api/bookings` | `ROLE_USER` | Create a pending booking |
| **Bookings**| `GET` | `/api/bookings/my` | `ROLE_USER` | List player's booking history |
| **Bookings**| `POST` | `/api/bookings/{id}/payment` | `ROLE_USER` | Submit UPI UTR & payment screenshot |
| **Owner** | `GET` | `/api/owner/venues` | `ROLE_OWNER` | List owned venues |
| **Owner** | `POST` | `/api/owner/slots/generate`| `ROLE_OWNER` | Bulk generate recurring slots |
| **Owner** | `GET` | `/api/owner/verifications` | `ROLE_OWNER` | Pending payment verification queue |
| **Owner** | `POST` | `/api/bookings/{id}/verify`| `ROLE_OWNER` | Approve or reject payment verification |
| **Admin** | `GET` | `/api/admin/reports` | `ROLE_ADMIN` | Platform analytics & financial report breakdown |
| **Admin** | `GET` | `/api/admin/stats` | `ROLE_ADMIN` | High-level platform statistics |
| **Admin** | `GET` | `/api/admin/users` | `ROLE_ADMIN` | Paginated user management list |
| **Admin** | `PATCH`| `/api/admin/venues/{id}/status` | `ROLE_ADMIN` | Activate or suspend venue |
| **Notifs** | `GET` | `/api/notifications` | Authenticated | User notification feed |
| **Notifs** | `PATCH`| `/api/notifications/{id}/read`| Authenticated | Mark notification as read |

*Interactive Swagger UI documentation is available at `/swagger-ui.html` on the running backend.*

---

## 🛡️ Reliability & Concurrency Safeguards

1. **Double-Booking Elimination:** Slot booking uses transactional locking combined with PostgreSQL partial unique constraints on `(slot_id)` for active booking statuses, preventing overbooking even under high concurrency.
2. **WAN Latency Optimization:** Spring Data JPA batch fetching eliminates N+1 query overhead across complex relations (venues, sports, amenities, slots, and media).
3. **Auto-Expiring Stale Bookings:** Scheduled background task releases pending reservations if payment proof is not submitted within the reservation window.
4. **Resilient Serialization:** Jackson `@JsonProperty` mappings ensure consistent camelCase and boolean contracts across Next.js and Spring Boot.

---

## 🚢 Deployment

### Frontend (Vercel)
1. Import repository into [Vercel](https://vercel.com).
2. Set root directory to `slotplay-frontend`.
3. Configure environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   ```
4. Deploy with automatic SSL and CDN caching.

### Backend (Railway / Render / AWS ECS / Docker)
1. Build the production Spring Boot executable JAR:
   ```bash
   ./mvnw clean package -DskipTests
   ```
2. Run via Java 21 runtime:
   ```bash
   java -jar target/slotplay-backend-java-1.0.0.jar
   ```
3. Set environment variables to your production Neon PostgreSQL credentials and Resend API key.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for Indian sports enthusiasts.*
