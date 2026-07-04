/**
 * seeders/index.ts
 *
 * Full production seed:
 *   1 Admin, 2 Owners, 5 Players
 *   10 Venues (5 per owner), 100+ Slots
 *   20 Bookings, Reviews, Notifications
 *
 * Run: npm run seed
 * Safe to run multiple times (idempotent via findOrCreate).
 */

import 'module-alias/register';
import bcrypt from 'bcrypt';
import { sequelize } from '@/config/database';
import {
  Role, User, Venue, Sport, Amenity, Slot, Booking,
  Payment, Review, Notification,
} from '@/models';
import { logger } from '@/config/logger';

// ── Helpers ────────────────────────────────────────────────────────────────────

function addHours(date: Date, h: number) {
  return new Date(date.getTime() + h * 3_600_000);
}

function futureDate(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function seed() {
  await sequelize.authenticate();
  logger.info('[Seed] Connected to database');

  // ── Roles ────────────────────────────────────────────────────────────────────
  const [userRole]  = await Role.findOrCreate({ where: { name: 'user'  }, defaults: { name: 'user' }  });
  const [ownerRole] = await Role.findOrCreate({ where: { name: 'owner' }, defaults: { name: 'owner' } });
  const [adminRole] = await Role.findOrCreate({ where: { name: 'admin' }, defaults: { name: 'admin' } });
  logger.info('[Seed] Roles OK');

  // ── Sports ───────────────────────────────────────────────────────────────────
  const sportsData = [
    { name: 'Cricket',    icon: '🏏' },
    { name: 'Football',   icon: '⚽' },
    { name: 'Badminton',  icon: '🏸' },
    { name: 'Basketball', icon: '🏀' },
    { name: 'Tennis',     icon: '🎾' },
    { name: 'Volleyball', icon: '🏐' },
    { name: 'Kabaddi',    icon: '🤼' },
    { name: 'Hockey',     icon: '🏑' },
  ];
  const sports: Sport[] = [];
  for (const s of sportsData) {
    const [sport] = await Sport.findOrCreate({ where: { name: s.name }, defaults: s });
    sports.push(sport);
  }
  logger.info('[Seed] Sports OK');

  // ── Amenities ────────────────────────────────────────────────────────────────
  const amenitiesData = [
    { name: 'Floodlights',      icon: 'Zap'          },
    { name: 'Parking',          icon: 'ParkingCircle' },
    { name: 'Changing Rooms',   icon: 'ShowerHead'   },
    { name: 'Drinking Water',   icon: 'Droplets'     },
    { name: 'WiFi',             icon: 'Wifi'         },
    { name: 'Cafeteria',        icon: 'Coffee'       },
    { name: 'First Aid',        icon: 'Shield'       },
    { name: 'Equipment Rental', icon: 'Package'      },
    { name: 'Seating Gallery',  icon: 'Users'        },
    { name: 'Restrooms',        icon: 'Wind'         },
    { name: 'Security',         icon: 'Lock'         },
    { name: 'CCTV',             icon: 'Camera'       },
  ];
  const amenities: Amenity[] = [];
  for (const a of amenitiesData) {
    const [amenity] = await Amenity.findOrCreate({ where: { name: a.name }, defaults: a });
    amenities.push(amenity);
  }
  logger.info('[Seed] Amenities OK');

  // ── Admin ────────────────────────────────────────────────────────────────────
  const [admin] = await User.findOrCreate({
    where: { email: 'admin@slotplay.in' },
    defaults: {
      name: 'SlotPlay Admin',
      email: 'admin@slotplay.in',
      passwordHash: await hash('Admin@123!'),
      roleId: adminRole.id,
      isVerified: true,
      phone: '9000000001',
    },
  });
  logger.info('[Seed] Admin created:', admin.email);

  // ── Owners ───────────────────────────────────────────────────────────────────
  const ownerProfiles = [
    { name: 'Ravi Kumar',  email: 'ravi@slotplay.in',  phone: '9111111111' },
    { name: 'Priya Reddy', email: 'priya@slotplay.in', phone: '9222222222' },
  ];
  const owners: User[] = [];
  for (const o of ownerProfiles) {
    const [owner] = await User.findOrCreate({
      where: { email: o.email },
      defaults: { ...o, passwordHash: await hash('Owner@123!'), roleId: ownerRole.id, isVerified: true },
    });
    owners.push(owner);
  }
  logger.info('[Seed] Owners created');

  // ── Players ───────────────────────────────────────────────────────────────────
  const playerData = [
    { name: 'Arjun Sharma',  email: 'arjun@example.com',  phone: '9333333331' },
    { name: 'Meera Nair',    email: 'meera@example.com',   phone: '9333333332' },
    { name: 'Karan Patel',   email: 'karan@example.com',   phone: '9333333333' },
    { name: 'Divya Iyer',    email: 'divya@example.com',   phone: '9333333334' },
    { name: 'Rohit Sinha',   email: 'rohit@example.com',   phone: '9333333335' },
  ];
  const players: User[] = [];
  for (const p of playerData) {
    const [player] = await User.findOrCreate({
      where: { email: p.email },
      defaults: { ...p, passwordHash: await hash('Player@123!'), roleId: userRole.id, isVerified: true },
    });
    players.push(player);
  }
  logger.info('[Seed] Players created');

  // ── Venues ───────────────────────────────────────────────────────────────────
  const venueData = [
    // Owner 1 (Ravi Kumar) — Hyderabad venues
    {
      ownerId: owners[0].id, name: 'Green Field Cricket Turf',
      description: 'Premium synthetic cricket turf with floodlights. Perfect for evening matches. Professional-grade pitch surface used by local clubs.',
      address: '42, Jubilee Hills Road No. 36', city: 'Hyderabad', state: 'Telangana', pincode: '500033',
      latitude: 17.4324, longitude: 78.4071, pricePerHour: 800, phone: '9111111111',
      sports: ['Cricket'], amenities: ['Floodlights', 'Parking', 'Changing Rooms', 'Drinking Water'],
    },
    {
      ownerId: owners[0].id, name: 'HiTech Football Ground',
      description: 'Full-size 7-a-side astroturf football ground in the heart of HiTech City. FIFA-approved turf surface, excellent drainage.',
      address: 'Plot 15, HITEC City Phase 2', city: 'Hyderabad', state: 'Telangana', pincode: '500081',
      latitude: 17.4486, longitude: 78.3773, pricePerHour: 1200, phone: '9111111111',
      sports: ['Football'], amenities: ['Floodlights', 'Parking', 'Cafeteria', 'First Aid'],
    },
    {
      ownerId: owners[0].id, name: 'City Sports Complex',
      description: 'Multi-sport facility offering cricket, football, and badminton. Air-conditioned badminton courts, natural turf cricket ground.',
      address: '7-1-58, Ameerpet', city: 'Hyderabad', state: 'Telangana', pincode: '500016',
      latitude: 17.4371, longitude: 78.4483, pricePerHour: 600, phone: '9111111112',
      sports: ['Cricket', 'Football', 'Badminton'], amenities: ['WiFi', 'Cafeteria', 'Restrooms', 'Security'],
    },
    {
      ownerId: owners[0].id, name: 'Madhapur Premier Turf',
      description: 'State-of-the-art cricket turf with spring-loaded pitch. Corporate packages available. CCTV monitored 24/7.',
      address: 'Survey No. 64, Madhapur', city: 'Hyderabad', state: 'Telangana', pincode: '500081',
      latitude: 17.4504, longitude: 78.3828, pricePerHour: 1000, phone: '9111111113',
      sports: ['Cricket'], amenities: ['Floodlights', 'CCTV', 'Parking', 'First Aid', 'Equipment Rental'],
    },
    {
      ownerId: owners[0].id, name: 'Gachibowli Arena',
      description: 'Professional sports arena near the financial district. Multiple courts for badminton and basketball. Rated 4.9 by corporate teams.',
      address: 'Plot 5, Financial District', city: 'Hyderabad', state: 'Telangana', pincode: '500032',
      latitude: 17.4126, longitude: 78.3451, pricePerHour: 700, phone: '9111111114',
      sports: ['Badminton', 'Basketball'], amenities: ['WiFi', 'Parking', 'Drinking Water', 'Seating Gallery'],
    },

    // Owner 2 (Priya Reddy) — Bangalore venues
    {
      ownerId: owners[1].id, name: 'Koramangala Cricket Hub',
      description: 'Premium cricket turf in Koramangala. 22-yard professional pitch, T20 format ready. Popular with Bangalore tech teams.',
      address: '5th Block, Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560095',
      latitude: 12.9352, longitude: 77.6245, pricePerHour: 900, phone: '9222222222',
      sports: ['Cricket'], amenities: ['Floodlights', 'Parking', 'Cafeteria', 'WiFi'],
    },
    {
      ownerId: owners[1].id, name: 'Indiranagar Football Turf',
      description: 'FIFA quality astroturf football ground in Indiranagar. 5-a-side and 7-a-side configurations. Very popular on weekends.',
      address: '100 Feet Road, Indiranagar', city: 'Bangalore', state: 'Karnataka', pincode: '560038',
      latitude: 12.9716, longitude: 77.6412, pricePerHour: 1400, phone: '9222222223',
      sports: ['Football'], amenities: ['Floodlights', 'Parking', 'Changing Rooms', 'First Aid'],
    },
    {
      ownerId: owners[1].id, name: 'Whitefield Sports Center',
      description: 'Modern sports center with cricket, football, and tennis. Near Whitefield tech park. Corporate tie-ups available.',
      address: 'ITPL Main Road, Whitefield', city: 'Bangalore', state: 'Karnataka', pincode: '560066',
      latitude: 12.9698, longitude: 77.7499, pricePerHour: 750, phone: '9222222224',
      sports: ['Cricket', 'Football', 'Tennis'], amenities: ['WiFi', 'Parking', 'Cafeteria', 'CCTV', 'Security'],
    },
    {
      ownerId: owners[1].id, name: 'JP Nagar Badminton Academy',
      description: 'Professional badminton courts with wooden flooring. Shuttle feeder machines available. Coaching sessions on request.',
      address: '7th Phase, JP Nagar', city: 'Bangalore', state: 'Karnataka', pincode: '560078',
      latitude: 12.9063, longitude: 77.5920, pricePerHour: 450, phone: '9222222225',
      sports: ['Badminton'], amenities: ['WiFi', 'Drinking Water', 'Equipment Rental', 'Restrooms'],
    },
    {
      ownerId: owners[1].id, name: 'Marathahalli Cricket Ground',
      description: 'Budget-friendly cricket ground near Outer Ring Road. Perfect for club matches and tournaments. Ample parking space.',
      address: 'Near Tin Factory, Marathahalli', city: 'Bangalore', state: 'Karnataka', pincode: '560037',
      latitude: 12.9591, longitude: 77.6974, pricePerHour: 550, phone: '9222222226',
      sports: ['Cricket', 'Football'], amenities: ['Parking', 'Drinking Water', 'Restrooms'],
    },
  ];

  const createdVenues: Venue[] = [];
  for (const v of venueData) {
    const { sports: sportNames, amenities: amenityNames, ...venueFields } = v;
    const [venue] = await Venue.findOrCreate({
      where: { name: venueFields.name, ownerId: venueFields.ownerId },
      defaults: { ...venueFields, isActive: true },
    });

    // Associate sports
    const sportObjs = sports.filter(s => sportNames.includes(s.name));
    await (venue as any).setSports(sportObjs);

    // Associate amenities
    const amenityObjs = amenities.filter(a => amenityNames.includes(a.name));
    await (venue as any).setAmenities(amenityObjs);

    createdVenues.push(venue);
  }
  logger.info('[Seed] Venues created:', createdVenues.length);

  // ── Slots — generate 7 days × 6AM–10PM for every venue ───────────────────────
  let slotCount = 0;
  const createdSlots: Slot[] = [];

  for (const venue of createdVenues) {
    for (let day = 0; day < 14; day++) {
      const baseDate = futureDate(day);
      const dateStr  = baseDate.toISOString().split('T')[0]; // YYYY-MM-DD

      for (let hour = 6; hour < 22; hour++) {
        const startStr = `${String(hour).padStart(2,'0')}:00`;
        const endStr   = `${String(hour + 1).padStart(2,'0')}:00`;

        const [slot, created] = await Slot.findOrCreate({
          where: { venueId: venue.id, date: dateStr, startTime: startStr },
          defaults: {
            venueId:   venue.id,
            date:      dateStr,
            startTime: startStr,
            endTime:   endStr,
            price:     venue.pricePerHour,
            status:    'available',
          },
        });
        if (created) { createdSlots.push(slot); slotCount++; }
      }
    }
  }
  logger.info('[Seed] Slots created:', slotCount);

  // ── Bookings — 20 realistic bookings ──────────────────────────────────────────
  function randomItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

  const bookingStatuses = [
    'confirmed', 'confirmed', 'confirmed', 'confirmed',
    'pending_payment', 'pending_payment',
    'rejected', 'cancelled',
  ];

  const bookingRefs: string[] = [];
  const createdBookings: Booking[] = [];

  // Pick 20 different slots spread across venues
  const bookingSlots = createdSlots
    .filter(s => new Date(`${s.date}T${s.startTime}`) > new Date()) // only future slots
    .slice(0, 30)
    .sort(() => Math.random() - 0.5)
    .slice(0, 20);

  for (let i = 0; i < bookingSlots.length; i++) {
    const slot   = bookingSlots[i];
    const player = players[i % players.length];
    const status = bookingStatuses[i % bookingStatuses.length] as any;
    const ref    = `SP-${Date.now().toString(36).toUpperCase()}-${String(i).padStart(3,'0')}`;

    const [booking] = await Booking.findOrCreate({
      where: { slotId: slot.id },
      defaults: {
        userId: player.id,
        slotId: slot.id,
        venueId: slot.venueId,
        bookingRef: ref,
        status,
        totalAmount: slot.price,
      },
    });

    // Create payment record
    await Payment.findOrCreate({
      where: { bookingId: booking.id },
      defaults: {
        bookingId: booking.id,
        amount: slot.pricePerHour,
        currency: 'INR',
        method: 'upi',
        status: status === 'confirmed' ? 'verified' : status === 'pending_payment' ? 'submitted' : 'rejected',
      },
    });

    bookingRefs.push(ref);
    createdBookings.push(booking);
  }
  logger.info('[Seed] Bookings created:', createdBookings.length);

  // ── Reviews — for confirmed bookings ──────────────────────────────────────────
  const confirmedBookings = createdBookings.filter(b => b.status === 'confirmed');
  const reviewTexts = [
    'Great turf, excellent surface quality. Will definitely book again!',
    'Perfect lighting for evening matches. Highly recommended.',
    'Good facility but parking can be tight on weekends.',
    'Amazing experience! The turf is top-notch and staff very friendly.',
    'Clean and well-maintained. Booking was super easy.',
    'Nice location, easy to reach. The turf quality is very good.',
    'Excellent floodlights and facilities. Our team loves this place.',
    'Value for money. The app made booking so convenient.',
  ];

  for (let i = 0; i < confirmedBookings.length && i < 15; i++) {
    const b = confirmedBookings[i];
    await Review.findOrCreate({
      where: { userId: b.userId, venueId: b.venueId },
      defaults: {
        userId: b.userId,
        venueId: b.venueId,
        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5
        comment: reviewTexts[i % reviewTexts.length],
      },
    });
  }
  logger.info('[Seed] Reviews created');

  // ── Notifications ─────────────────────────────────────────────────────────────
  const notifTemplates = [
    { type: 'booking_confirmed', title: 'Booking Confirmed! ✅', body: 'Your slot has been confirmed. Check your QR ticket.' },
    { type: 'payment_submitted', title: 'Payment Submitted ⏳', body: 'Payment screenshot received. Awaiting owner verification.' },
    { type: 'payment_rejected',  title: 'Payment Not Verified ❌', body: 'Your payment could not be verified. Please retry with a clear screenshot.' },
  ];

  for (const player of players) {
    for (const tmpl of notifTemplates) {
      await Notification.findOrCreate({
        where: { userId: player.id, type: tmpl.type },
        defaults: { userId: player.id, ...tmpl, isRead: false },
      });
    }
  }
  logger.info('[Seed] Notifications created');

  // ── Summary ───────────────────────────────────────────────────────────────────
  logger.info('[Seed] ✅ All done!');
  console.log('\n================================');
  console.log('  SlotPlay Database Seeded ✅');
  console.log('================================');
  console.log(`  Admin:    admin@slotplay.in / Admin@123!`);
  console.log(`  Owner 1:  ravi@slotplay.in  / Owner@123!`);
  console.log(`  Owner 2:  priya@slotplay.in / Owner@123!`);
  console.log(`  Player:   arjun@example.com / Player@123!`);
  console.log(`  Venues:   ${createdVenues.length}`);
  console.log(`  Slots:    ${slotCount}`);
  console.log(`  Bookings: ${createdBookings.length}`);
  console.log('================================\n');

  await sequelize.close();
}

seed().catch(err => {
  console.error('[Seed] Fatal error:', err);
  process.exit(1);
});
