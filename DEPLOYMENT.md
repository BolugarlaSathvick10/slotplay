# SlotPlay — Production Deployment Guide

This guide walks you through deploying the complete SlotPlay application to production with **Vercel** for the Next.js frontend and a Java/Docker platform (**Render** or **Railway**) for the Spring Boot backend.

---

## 🏗️ Architecture Overview

| Component | Technology | Target Hosting | Why? |
|---|---|---|---|
| **Frontend** | Next.js 14 (App Router) + Tailwind CSS | **Vercel** | Native Next.js edge caching, automatic SSL, preview URLs, instant builds |
| **Backend** | Java 21 LTS + Spring Boot 3.3.5 | **Render** or **Railway** (Docker) | Continuous JVM runtime, Flyway database migrations, connection pooling |
| **Database** | PostgreSQL Serverless | **Neon** | Serverless PostgreSQL with SSL and automatic backups |
| **Proxy & Rewrites** | Next.js Reverse Proxy (`next.config.js`) | **Vercel** | Proxies `/api/*` to backend to ensure **same-origin session cookies** (`slotplay.sid`) |

> [!IMPORTANT]
> **Why can't the Java backend run directly on Vercel?**
> Vercel is designed specifically for frontend applications and serverless Node.js/Edge functions. It does not provide persistent JVM containers for long-running Java/Spring Boot applications. The standard, recommended architecture is hosting the Next.js frontend on Vercel and the Spring Boot backend on a free/affordable container platform like Render or Railway. Next.js rewrites bridge them together seamlessly under the same domain.

---

## 🚀 Step 1: Deploy the Backend (Render or Railway)

Choose either **Render** (free tier available) or **Railway**.

### Option A: Deploy on Render (Recommended)

1. Push your repository to GitHub.
2. Log in to [Render](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository (`slotplay`).
4. Configure the service:
   - **Name:** `slotplay-backend`
   - **Region:** Choose the region closest to your Neon database (e.g., Frankfurt, Oregon, Singapore)
   - **Language / Runtime:** **Docker**
   - **Dockerfile Path:** `slotplay-backend-java/Dockerfile`
   - **Docker Context:** `slotplay-backend-java`
   - **Instance Type:** Free (or Starter)
5. Under **Environment Variables**, add:
   ```ini
   PORT=4000
   SPRING_PROFILES_ACTIVE=prod
   DATABASE_URL=postgresql://<user>:<password>@<neon-host>/neondb?sslmode=require
   DATABASE_USERNAME=<neon-username>
   DATABASE_PASSWORD=<neon-password>
   FRONTEND_URL=https://*.vercel.app,http://localhost:3000
   SESSION_SECRET=<generate-a-random-64-character-string>
   SESSION_COOKIE_SECURE=true
   SESSION_COOKIE_SAME_SITE=lax
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=SlotPlay <slotplay@nmart.me>
   STORAGE_PROVIDER=local
   ```
6. Click **Deploy Web Service**.
7. Once deployed, test your backend:
   ```
   https://slotplay-backend.onrender.com/api/health
   ```
   It should return: `{"success":true,"status":"UP"}`.
   *Copy this backend URL — you will need it in Step 2.*

---

### Option B: Deploy on Railway

1. Log in to [Railway](https://railway.app) and click **New Project** -> **Deploy from GitHub repo**.
2. Select the `slotplay` repository.
3. In **Settings** -> **Build**:
   - Set **Root Directory** to `/slotplay-backend-java`
   - Railway will automatically detect the `Dockerfile` and `railway.json`.
4. In **Variables**, add the same environment variables listed above.
5. In **Settings** -> **Networking**, click **Generate Domain** to get your public URL (e.g., `https://slotplay-backend.up.railway.app`).

---

## ⚡ Step 2: Deploy the Frontend on Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com) and click **Add New...** -> **Project**.
2. Import your `slotplay` Git repository.
3. Configure the project settings:
   - **Framework Preset:** `Next.js` (detected automatically)
   - **Root Directory:** Click **Edit** and choose `slotplay-frontend` (⚠️ **CRITICAL**)
4. Open **Environment Variables** and add:
   | Key | Value | Description |
   |---|---|---|
   | `BACKEND_URL` | `https://slotplay-backend.onrender.com` | Target URL for Next.js server-side rewrites and edge auth middleware |
   | `NEXT_PUBLIC_API_URL` | *(leave empty or set to same URL)* | Client requests default to relative `/api/*`, automatically using the proxy |
5. Click **Deploy**.
6. Vercel will run `npm install`, compile TypeScript, run ESLint, and deploy your site to `https://slotplay.vercel.app`!

---

## 🔐 How the Authentication & Cookie Architecture Works

By configuring `BACKEND_URL` in Vercel:
1. **Next.js Reverse Proxy:**
   - In `slotplay-frontend/next.config.js`, all requests to `/api/:path*` and `/uploads/:path*` are rewritten to your backend.
   - The browser sends requests to `https://slotplay.vercel.app/api/...` (same-origin).
2. **Session Cookies (`slotplay.sid`):**
   - The session cookie is issued on `slotplay.vercel.app`.
   - Modern browsers (Chrome, Safari, iOS, Firefox) will **never block** it because it is first-party/same-origin.
3. **Edge Middleware (`middleware.ts`):**
   - When a user accesses protected pages (`/dashboard`, `/bookings`, `/owner`, `/admin`), Next.js Edge middleware intercepts the request.
   - It forwards `slotplay.sid` to `${BACKEND_URL}/api/auth/me`.
   - If valid, access is granted with 0 roundtrips visible to the client.

---

## 🧪 Pre-Flight Deployment Checklist

- [x] **Frontend ESLint:** Zero unescaped entities or lint errors (`npm run lint` passes).
- [x] **TypeScript Validation:** Strict types pass with no errors (`npm run type-check` passes).
- [x] **Vercel Config:** Removed deprecated `@slotplay_api_url` from `vercel.json`.
- [x] **Next.js Proxy Rewrites:** Configured `/api/*` and `/uploads/*` in `next.config.js`.
- [x] **Backend Dockerfile:** Multi-stage Java 21 build with non-root runner user and health checks.
- [x] **CORS Wildcards:** Backend supports `https://*.vercel.app` for preview deployments and multiple domains.
- [x] **Cookie Security:** Backend production profile defaults to `SameSite=Lax` and `Secure=true`.
- [x] **Database Migrations:** Flyway automatically applies `V1__initial_schema.sql` on startup.

---

## 🛠️ Verification After Deployment

Once both are deployed:
1. Visit `https://your-frontend.vercel.app` in your browser.
2. Check that turf listings load from the backend.
3. Click **Login** and sign in using a demo account:
   - **Admin:** `admin@slotplay.in` / `Admin@123!`
   - **Owner:** `ravi@slotplay.in` / `Owner@123!`
   - **Player:** `arjun@example.com` / `Player@123!`
4. Verify you can access `/dashboard` or `/admin/reports` without being redirected.

