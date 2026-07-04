/**
 * migrations/001_initial_schema.sql
 *
 * Complete initial schema for SlotPlay on Neon PostgreSQL.
 *
 * Run manually via Neon SQL Editor or psql:
 *   psql $DATABASE_URL -f migrations/001_initial_schema.sql
 *
 * Tables are created in dependency order (no FK violations).
 * All UUIDs use gen_random_uuid() — requires pg_crypto (enabled by default on Neon).
 */

-- Enable UUID generation (enabled by default on Neon, safe to re-run)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── roles ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(20) NOT NULL UNIQUE
               CHECK (name IN ('user', 'owner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role_id       INTEGER     NOT NULL DEFAULT 1 REFERENCES roles(id),
  is_verified   BOOLEAN     NOT NULL DEFAULT false,
  avatar_url    VARCHAR(500),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email   ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- ── sessions (managed by connect-pg-simple) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  sid    VARCHAR     NOT NULL PRIMARY KEY,
  sess   JSONB       NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- ── otp_tokens ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_code   VARCHAR(6)  NOT NULL,
  purpose    VARCHAR(10) NOT NULL CHECK (purpose IN ('verify', 'reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  is_used    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_user_purpose ON otp_tokens(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires       ON otp_tokens(expires_at);

-- ── owner_profiles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owner_profiles (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(200) NOT NULL,
  gst_number    VARCHAR(20),
  is_approved   BOOLEAN      NOT NULL DEFAULT false,
  approved_at   TIMESTAMPTZ,
  approved_by   UUID         REFERENCES users(id),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── sports ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sports (
  id         SERIAL       PRIMARY KEY,
  name       VARCHAR(80)  NOT NULL UNIQUE,
  icon_url   VARCHAR(500),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── venues ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venues (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID           NOT NULL REFERENCES users(id),
  sport_id       INTEGER        NOT NULL REFERENCES sports(id),
  name           VARCHAR(200)   NOT NULL,
  description    TEXT,
  address        TEXT           NOT NULL,
  city           VARCHAR(100)   NOT NULL,
  state          VARCHAR(100)   NOT NULL,
  pincode        VARCHAR(10)    NOT NULL,
  latitude       DECIMAL(10,8),
  longitude      DECIMAL(11,8),
  price_per_hour DECIMAL(10,2)  NOT NULL,
  status         VARCHAR(20)    NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'active', 'suspended')),
  is_verified    BOOLEAN        NOT NULL DEFAULT false,
  avg_rating     DECIMAL(3,2)   NOT NULL DEFAULT 0,
  total_reviews  INTEGER        NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_venues_owner_id ON venues(owner_id);
CREATE INDEX IF NOT EXISTS idx_venues_sport_id ON venues(sport_id);
CREATE INDEX IF NOT EXISTS idx_venues_city     ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_status   ON venues(status);

-- ── venue_images ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venue_images (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    UUID         NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  storage_key VARCHAR(500) NOT NULL,
  url         VARCHAR(1000) NOT NULL,
  is_primary  BOOLEAN      NOT NULL DEFAULT false,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_venue_images_venue ON venue_images(venue_id);

-- ── amenities ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amenities (
  id         SERIAL      PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  icon       VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── venue_amenities (junction) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venue_amenities (
  venue_id   UUID    NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  amenity_id INTEGER NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (venue_id, amenity_id)
);

-- ── slot_templates ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS slot_templates (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    UUID          NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  day_of_week SMALLINT      NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  TIME          NOT NULL,
  end_time    TIME          NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_slot_templates_venue ON slot_templates(venue_id, day_of_week);

-- ── slots ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS slots (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id   UUID          NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  date       DATE          NOT NULL,
  start_time TIME          NOT NULL,
  end_time   TIME          NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  status     VARCHAR(20)   NOT NULL DEFAULT 'available'
               CHECK (status IN ('available', 'booked', 'blocked')),
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT slots_venue_date_start_unique UNIQUE (venue_id, date, start_time)
);
CREATE INDEX IF NOT EXISTS idx_slots_venue_date   ON slots(venue_id, date);
CREATE INDEX IF NOT EXISTS idx_slots_venue_status ON slots(venue_id, status);

-- ── bookings ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID          NOT NULL REFERENCES users(id),
  slot_id      UUID          NOT NULL REFERENCES slots(id),
  venue_id     UUID          NOT NULL REFERENCES venues(id),
  booking_ref  VARCHAR(30)   NOT NULL UNIQUE,
  total_amount DECIMAL(10,2) NOT NULL,
  status       VARCHAR(30)   NOT NULL DEFAULT 'pending_payment'
                 CHECK (status IN (
                   'pending_payment', 'pending_verification',
                   'confirmed', 'rejected', 'cancelled'
                 )),
  qr_code_url  VARCHAR(1000),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id  ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_venue_id ON bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_id  ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status   ON bookings(status);

-- ── payments ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID          NOT NULL REFERENCES bookings(id),
  user_id    UUID          NOT NULL REFERENCES users(id),
  amount     DECIMAL(10,2) NOT NULL,
  currency   VARCHAR(5)    NOT NULL DEFAULT 'INR',
  method     VARCHAR(20)   NOT NULL DEFAULT 'upi_manual'
               CHECK (method IN ('upi_manual', 'razorpay', 'stripe')),
  status     VARCHAR(20)   NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'submitted', 'verified', 'rejected', 'refunded')),
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user    ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments(status);

-- ── payment_verifications ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_verifications (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id     UUID         NOT NULL REFERENCES payments(id),
  booking_id     UUID         NOT NULL REFERENCES bookings(id),
  submitted_by   UUID         NOT NULL REFERENCES users(id),
  utr_number     VARCHAR(50)  NOT NULL,
  screenshot_key VARCHAR(500) NOT NULL,
  screenshot_url VARCHAR(1000) NOT NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'submitted'
                   CHECK (status IN ('submitted', 'approved', 'rejected')),
  reviewed_by    UUID         REFERENCES users(id),
  review_note    TEXT,
  submitted_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pv_booking    ON payment_verifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_pv_payment    ON payment_verifications(payment_id);
CREATE INDEX IF NOT EXISTS idx_pv_submitter  ON payment_verifications(submitted_by);
CREATE INDEX IF NOT EXISTS idx_pv_status     ON payment_verifications(status);

-- ── owner_upi_qr ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owner_upi_qr (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID          NOT NULL REFERENCES users(id),
  venue_id     UUID          NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  upi_id       VARCHAR(100)  NOT NULL,
  qr_image_key VARCHAR(500)  NOT NULL,
  qr_image_url VARCHAR(1000) NOT NULL,
  display_name VARCHAR(200)  NOT NULL,
  is_active    BOOLEAN       NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_upi_qr_owner ON owner_upi_qr(owner_id);
CREATE INDEX IF NOT EXISTS idx_upi_qr_venue ON owner_upi_qr(venue_id);

-- ── reviews ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id),
  venue_id   UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  booking_id UUID        NOT NULL UNIQUE REFERENCES bookings(id),
  rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_venue ON reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user  ON reviews(user_id);

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(40)  NOT NULL,
  title      VARCHAR(200) NOT NULL,
  body       TEXT         NOT NULL,
  is_read    BOOLEAN      NOT NULL DEFAULT false,
  metadata   JSONB,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- ── admin_logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   UUID        NOT NULL REFERENCES users(id),
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(50)  NOT NULL,
  entity_id  UUID         NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin  ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON admin_logs(entity, entity_id);
