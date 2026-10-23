-- V2: Prevent duplicate active bookings for the same slot at the database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_slot_booking
ON bookings (slot_id)
WHERE status IN ('pending_payment', 'pending_verification', 'confirmed');
