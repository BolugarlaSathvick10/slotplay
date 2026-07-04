/**
 * models/index.ts
 *
 * Single entry point for all models.
 *
 * ALL Sequelize associations are defined here rather than inside individual
 * model files. This avoids circular-import issues and makes the full
 * relationship map visible in one place.
 *
 * Import models from this file across the codebase:
 *   import { User, Venue, Booking } from '@/models';
 */

// ── Model imports ─────────────────────────────────────────────────────────────
export { Role } from './Role';
export { User } from './User';
export { OtpToken } from './OtpToken';
export { OwnerProfile } from './OwnerProfile';
export { Sport } from './Sport';
export { Venue } from './Venue';
export { VenueImage, Amenity, VenueAmenity } from './VenueImage';
export { Slot, SlotTemplate } from './Slot';
export { Booking, Payment, PaymentVerification } from './Booking';
export { OwnerUpiQr, Review, Notification, AdminLog } from './OwnerUpiQr';

// Re-import for association setup (avoid re-declaring the same names)
import { Role } from './Role';
import { User } from './User';
import { OtpToken } from './OtpToken';
import { OwnerProfile } from './OwnerProfile';
import { Sport } from './Sport';
import { Venue } from './Venue';
import { VenueImage, Amenity, VenueAmenity } from './VenueImage';
import { Slot, SlotTemplate } from './Slot';
import { Booking, Payment, PaymentVerification } from './Booking';
import { OwnerUpiQr, Review, Notification, AdminLog } from './OwnerUpiQr';

// ── Associations ──────────────────────────────────────────────────────────────

// User ↔ Role
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// User → OtpToken
User.hasMany(OtpToken, { foreignKey: 'user_id', as: 'otpTokens' });
OtpToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ OwnerProfile (1:1)
User.hasOne(OwnerProfile, { foreignKey: 'user_id', as: 'ownerProfile' });
OwnerProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User (owner) → Venue
User.hasMany(Venue, { foreignKey: 'owner_id', as: 'venues' });
Venue.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Sport → Venue
Sport.hasMany(Venue, { foreignKey: 'sport_id', as: 'venues' });
Venue.belongsTo(Sport, { foreignKey: 'sport_id', as: 'sport' });

// Venue → VenueImage
Venue.hasMany(VenueImage, { foreignKey: 'venue_id', as: 'images' });
VenueImage.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });

// Venue ↔ Amenity (M:M via VenueAmenity)
Venue.belongsToMany(Amenity, {
  through: VenueAmenity,
  foreignKey: 'venue_id',
  otherKey: 'amenity_id',
  as: 'amenities',
});
Amenity.belongsToMany(Venue, {
  through: VenueAmenity,
  foreignKey: 'amenity_id',
  otherKey: 'venue_id',
  as: 'venues',
});

// Venue → Slot
Venue.hasMany(Slot, { foreignKey: 'venue_id', as: 'slots' });
Slot.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });

// Venue → SlotTemplate
Venue.hasMany(SlotTemplate, { foreignKey: 'venue_id', as: 'slotTemplates' });
SlotTemplate.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });

// Venue → OwnerUpiQr
Venue.hasMany(OwnerUpiQr, { foreignKey: 'venue_id', as: 'upiQrCodes' });
OwnerUpiQr.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });

// User (owner) → OwnerUpiQr
User.hasMany(OwnerUpiQr, { foreignKey: 'owner_id', as: 'upiQrCodes' });
OwnerUpiQr.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// User → Booking
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Slot → Booking (1:1 — a slot can only have one confirmed booking)
Slot.hasOne(Booking, { foreignKey: 'slot_id', as: 'booking' });
Booking.belongsTo(Slot, { foreignKey: 'slot_id', as: 'slot' });

// Venue → Booking
Venue.hasMany(Booking, { foreignKey: 'venue_id', as: 'bookings' });
Booking.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });

// Booking → Payment (1:1)
Booking.hasOne(Payment, { foreignKey: 'booking_id', as: 'payment' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// User → Payment
User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Payment → PaymentVerification (1:1)
Payment.hasOne(PaymentVerification, {
  foreignKey: 'payment_id',
  as: 'verification',
});
PaymentVerification.belongsTo(Payment, {
  foreignKey: 'payment_id',
  as: 'payment',
});

// Booking → PaymentVerification
Booking.hasOne(PaymentVerification, {
  foreignKey: 'booking_id',
  as: 'verification',
});
PaymentVerification.belongsTo(Booking, {
  foreignKey: 'booking_id',
  as: 'booking',
});

// Booking → Review (1:1)
Booking.hasOne(Review, { foreignKey: 'booking_id', as: 'review' });
Review.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// User → Review
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Venue → Review
Venue.hasMany(Review, { foreignKey: 'venue_id', as: 'reviews' });
Review.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });

// User → Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User (admin) → AdminLog
User.hasMany(AdminLog, { foreignKey: 'admin_id', as: 'adminLogs' });
AdminLog.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });
