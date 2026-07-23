/**
 * seeders/index.ts
 *
 * Seed: 5 Tirupati turfs, 1 admin, 2 owners, 5 players.
 * 14 days × 5 random slots per venue — bulk inserted for speed.
 *
 * Run once: npm run seed
 */

// Must be first — loads .env before any config module runs
import 'dotenv/config';

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sequelize } from '@/config/database';
import {
  Role, User, Venue, Sport, Amenity, Slot, Booking,
  Payment, Review, Notification,
} from '@/models';
import { logger } from '@/config/logger';
import {
  BookingStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  SlotStatus,
  UserRole,
  VenueStatus,
} from '@/types';

// ── Helpers ────────────────────────────────────────────────────────────────────

async function hash(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}

/** Returns date string YYYY-MM-DD for today + daysFromNow */
function dateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

/** Pad hour to HH:MM */
function hhmm(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/** Pick n unique random items from arr */
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function seed() {
  await sequelize.authenticate();
  logger.info('[Seed] Connected');

  // ── Roles ─────────────────────────────────────────────────────────────────────
  const [userRole]  = await Role.findOrCreate({ where: { name: UserRole.USER  }, defaults: { name: UserRole.USER  } });
  const [ownerRole] = await Role.findOrCreate({ where: { name: UserRole.OWNER }, defaults: { name: UserRole.OWNER } });
  const [adminRole] = await Role.findOrCreate({ where: { name: UserRole.ADMIN }, defaults: { name: UserRole.ADMIN } });

  // ── Sports ────────────────────────────────────────────────────────────────────
  const [cricket]   = await Sport.findOrCreate({ where: { name: 'Cricket'  }, defaults: { name: 'Cricket'  } });
  const [football]  = await Sport.findOrCreate({ where: { name: 'Football' }, defaults: { name: 'Football' } });
  const [badminton] = await Sport.findOrCreate({ where: { name: 'Badminton'}, defaults: { name: 'Badminton'} });

  // ── Amenities ─────────────────────────────────────────────────────────────────
  const amenityDefs = [
    { name: 'Floodlights',    icon: 'Zap'          },
    { name: 'Parking',        icon: 'ParkingCircle' },
    { name: 'Changing Room',  icon: 'ShowerHead'   },
    { name: 'Drinking Water', icon: 'Droplets'      },
    { name: 'WiFi',           icon: 'Wifi'          },
    { name: 'First Aid',      icon: 'Shield'        },
  ];
  const amenities: Amenity[] = [];
  for (const a of amenityDefs) {
    const [rec] = await Amenity.findOrCreate({ where: { name: a.name }, defaults: a });
    amenities.push(rec);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────────
  await User.findOrCreate({
    where: { email: 'admin@slotplay.in' },
    defaults: {
      name: 'SlotPlay Admin', email: 'admin@slotplay.in',
      passwordHash: await hash('Admin@123!'),
      roleId: adminRole.id, isVerified: true, phone: '9000000001',
    },
  });

  // ── Owners ────────────────────────────────────────────────────────────────────
  const [owner1] = await User.findOrCreate({
    where: { email: 'ravi@slotplay.in' },
    defaults: {
      name: 'Ravi Kumar', email: 'ravi@slotplay.in',
      passwordHash: await hash('Owner@123!'),
      roleId: ownerRole.id, isVerified: true, phone: '9111111111',
    },
  });
  const [owner2] = await User.findOrCreate({
    where: { email: 'priya@slotplay.in' },
    defaults: {
      name: 'Priya Reddy', email: 'priya@slotplay.in',
      passwordHash: await hash('Owner@123!'),
      roleId: ownerRole.id, isVerified: true, phone: '9222222222',
    },
  });

  // ── Players ───────────────────────────────────────────────────────────────────
  const playerDefs = [
    { name: 'Arjun Sharma', email: 'arjun@example.com', phone: '9333333331' },
    { name: 'Meera Nair',   email: 'meera@example.com', phone: '9333333332' },
    { name: 'Karan Patel',  email: 'karan@example.com', phone: '9333333333' },
    { name: 'Divya Iyer',   email: 'divya@example.com', phone: '9333333334' },
    { name: 'Rohit Sinha',  email: 'rohit@example.com', phone: '9333333335' },
  ];
  const players: User[] = [];
  for (const p of playerDefs) {
    const [u] = await User.findOrCreate({
      where: { email: p.email },
      defaults: { ...p, passwordHash: await hash('Player@123!'), roleId: userRole.id, isVerified: true },
    });
    players.push(u);
  }

  logger.info('[Seed] Users OK');

  // ── 5 Tirupati Venues ─────────────────────────────────────────────────────────
  const venueDefs = [
    {
      name: 'Tirumala Cricket Arena',
      ownerId: owner1.id, sportId: cricket.id,
      description: 'Synthetic cricket turf near Renigunta Road with floodlights for evening sessions.',
      address: 'Survey No. 12, Renigunta Road', city: 'Tirupati', state: 'Andhra Pradesh', pincode: '517501',
      latitude: 13.6288, longitude: 79.4192, pricePerHour: 700, phone: '9222222221',
      amenityNames: ['Floodlights', 'Parking', 'Drinking Water'],
    },
    {
      name: 'SVN Sports Complex',
      ownerId: owner1.id, sportId: badminton.id,
      description: 'Multi-sport complex near Sri Venkateswara University with indoor badminton courts.',
      address: 'SV University Main Gate, Tirupati-Chandragiri Road', city: 'Tirupati', state: 'Andhra Pradesh', pincode: '517502',
      latitude: 13.6345, longitude: 79.4098, pricePerHour: 500, phone: '9222222222',
      amenityNames: ['Parking', 'Changing Room', 'Drinking Water'],
    },
    {
      name: 'Balaji Football Turf',
      ownerId: owner2.id, sportId: football.id,
      description: 'Premium astroturf football ground near Alipiri. Ideal for 5-a-side and 7-a-side matches.',
      address: 'Near Alipiri Checkpost, Alipiri Road', city: 'Tirupati', state: 'Andhra Pradesh', pincode: '517503',
      latitude: 13.6520, longitude: 79.4050, pricePerHour: 900, phone: '9222222223',
      amenityNames: ['Floodlights', 'Parking', 'Changing Room', 'First Aid'],
    },
    {
      name: 'Srinivasa Cricket Ground',
      ownerId: owner2.id, sportId: cricket.id,
      description: 'Well-maintained turf near Tirupati Bus Stand. Affordable hourly rates.',
      address: '14-2, Tilak Road, Near Bus Stand', city: 'Tirupati', state: 'Andhra Pradesh', pincode: '517501',
      latitude: 13.6380, longitude: 79.4220, pricePerHour: 600, phone: '9222222224',
      amenityNames: ['Floodlights', 'Drinking Water', 'WiFi'],
    },
    {
      name: 'Padmavathi Badminton Academy',
      ownerId: owner2.id, sportId: badminton.id,
      description: 'Professional wooden-floor badminton courts near Padmavathi temple. Equipment available.',
      address: 'Near Padmavathi Temple, Tiruchanur Road', city: 'Tirupati', state: 'Andhra Pradesh', pincode: '517503',
      latitude: 13.6210, longitude: 79.4160, pricePerHour: 450, phone: '9222222225',
      amenityNames: ['Parking', 'Changing Room', 'Drinking Water', 'WiFi'],
    },
  ];

  const venues: Venue[] = [];
  for (const v of venueDefs) {
    const { amenityNames, ...fields } = v;
    const [venue] = await Venue.findOrCreate({
      where: { name: fields.name, ownerId: fields.ownerId },
      defaults: { ...fields, status: VenueStatus.ACTIVE, isVerified: true },
    });
    const amenityObjs = amenities.filter(a => amenityNames.includes(a.name));
    await (venue as any).setAmenities(amenityObjs);
    venues.push(venue);
  }

  logger.info('[Seed] Venues OK:', venues.length);

  // ── Slots — bulk insert ───────────────────────────────────────────────────────
  // 5 random slots per venue per day for the next 14 days
  // Available hours: 6 AM – 10 PM (6..21). Pick 5 unique random hours per day.
  const AVAILABLE_HOURS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
  const DAYS = 14;
  const SLOTS_PER_DAY = 5;

  // Build the full batch, skip ones already in DB
  const existingSlots = await Slot.findAll({
    attributes: ['venueId', 'date', 'startTime'],
    raw: true,
  });
  const existingSet = new Set(
    existingSlots.map((s: any) => `${s.venueId}|${s.date}|${s.startTime}`),
  );

  const slotRows: object[] = [];
  for (const venue of venues) {
    for (let d = 0; d < DAYS; d++) {
      const day = dateStr(d);
      const hours = pickRandom(AVAILABLE_HOURS, SLOTS_PER_DAY).sort((a, b) => a - b);
      for (const hour of hours) {
        const start = hhmm(hour);
        const key   = `${venue.id}|${day}|${start}`;
        if (existingSet.has(key)) continue;
        slotRows.push({
          id:        uuidv4(),
          venueId:   venue.id,
          date:      day,
          startTime: start,
          endTime:   hhmm(hour + 1),
          price:     venue.pricePerHour,
          status:    SlotStatus.AVAILABLE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  if (slotRows.length > 0) {
    await Slot.bulkCreate(slotRows as any[], { ignoreDuplicates: true });
    logger.info(`[Seed] Slots bulk inserted: ${slotRows.length}`);
  } else {
    logger.info('[Seed] Slots already exist — skipped');
  }

  // ── Sample bookings (3 confirmed, 2 pending) ──────────────────────────────────
  const allSlots = await Slot.findAll({ limit: 10, order: [['createdAt', 'ASC']] });

  const bookingDefs = [
    { slot: allSlots[0], player: players[0], status: BookingStatus.CONFIRMED },
    { slot: allSlots[1], player: players[1], status: BookingStatus.CONFIRMED },
    { slot: allSlots[2], player: players[2], status: BookingStatus.CONFIRMED },
    { slot: allSlots[3], player: players[3], status: BookingStatus.PENDING_PAYMENT },
    { slot: allSlots[4], player: players[4], status: BookingStatus.PENDING_PAYMENT },
  ];

  const createdBookings: Booking[] = [];
  for (const bd of bookingDefs) {
    if (!bd.slot) continue;
    const [booking] = await Booking.findOrCreate({
      where: { slotId: bd.slot.id },
      defaults: {
        userId:      bd.player.id,
        slotId:      bd.slot.id,
        venueId:     bd.slot.venueId,
        bookingRef:  `SP-${Date.now().toString(36).toUpperCase()}`,
        status:      bd.status,
        totalAmount: bd.slot.price,
      },
    });
    await Payment.findOrCreate({
      where: { bookingId: booking.id },
      defaults: {
        bookingId: booking.id,
        userId:    bd.player.id,
        amount:    bd.slot.price,
        currency:  'INR',
        method:    PaymentMethod.UPI_MANUAL,
        status:    bd.status === BookingStatus.CONFIRMED
          ? PaymentStatus.VERIFIED
          : PaymentStatus.PENDING,
      },
    });
    createdBookings.push(booking);
  }

  logger.info('[Seed] Bookings OK:', createdBookings.length);

  // ── Reviews for confirmed bookings ────────────────────────────────────────────
  const reviewTexts = [
    'Great turf, excellent surface. Will definitely book again!',
    'Perfect lighting for evening matches. Highly recommended.',
    'Clean and well-maintained. Booking was super easy.',
  ];
  const confirmedBookings = createdBookings.filter(b => b.status === BookingStatus.CONFIRMED);
  for (let i = 0; i < confirmedBookings.length; i++) {
    const b = confirmedBookings[i];
    await Review.findOrCreate({
      where: { bookingId: b.id },
      defaults: {
        userId:    b.userId,
        venueId:   b.venueId,
        bookingId: b.id,
        rating:    5,
        comment:   reviewTexts[i % reviewTexts.length],
      },
    });
  }

  // ── Notifications ─────────────────────────────────────────────────────────────
  for (const player of players) {
    await Notification.findOrCreate({
      where: { userId: player.id, type: NotificationType.BOOKING_CONFIRMED },
      defaults: {
        userId: player.id,
        type:   NotificationType.BOOKING_CONFIRMED,
        title:  'Welcome to SlotPlay! 🎉',
        body:   'Browse and book your favourite sports venues in Tirupati.',
        isRead: false,
      },
    });
  }

  logger.info('[Seed] Done!');

  console.log('\n================================');
  console.log('  SlotPlay Seed Complete ✅');
  console.log('================================');
  console.log('  Admin:    admin@slotplay.in  / Admin@123!');
  console.log('  Owner 1:  ravi@slotplay.in   / Owner@123!');
  console.log('  Owner 2:  priya@slotplay.in  / Owner@123!');
  console.log('  Player:   arjun@example.com  / Player@123!');
  console.log(`  Venues:   ${venues.length} (all Tirupati)`);
  console.log(`  Slots:    ${slotRows.length} bulk inserted`);
  console.log('================================\n');

  await sequelize.close();
}

seed().catch(err => {
  console.error('[Seed] Fatal:', err);
  process.exit(1);
});
