/**
 * services/venue/VenueService.ts
 *
 * Business logic for venue operations.
 * Controllers call this — they never touch models directly.
 */

import { Op } from 'sequelize';
import { Venue, Sport, Amenity, Review, OwnerProfile, User, VenueImage } from '@/models';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';
import { VenueStatus, SlotStatus } from '@/types';
import type { ListVenuesInput, CreateVenueInput, UpdateVenueInput } from '@/validators/venue.validators';

// ── Haversine distance calculation (km) ──────────────────────────────────────

function distanceBetween(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Get paginated venues with filters ─────────────────────────────────────────

export async function listVenues(
  input: ListVenuesInput,
): Promise<{
  data: any[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const { page, limit, sportId, city, search, latitude, longitude, radiusKm, sortBy } = input;
  const offset = (page - 1) * limit;

  // Build WHERE clause
  const where: any = { status: 'active' };
  if (city) where.city = { [Op.iLike]: `%${city}%` };
  if (sportId) where.sportId = sportId;
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Fetch venues — VenueImage uses url+storageKey (not imageUrl/category)
  // Sport uses iconUrl (not icon)
  // Sequelize hasMany includes do NOT support limit/order inside the include itself
  let venues = await Venue.findAll({
    where,
    include: [
      {
        model: Sport,
        as: 'sport',
        // sportId filter already in where clause above; no need for where here
        attributes: ['id', 'name', 'iconUrl'],
      },
      {
        model: Amenity,
        as: 'amenities',
        through: { attributes: [] },
        attributes: ['id', 'name', 'icon'],
      },
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email', 'avatarUrl'],
      },
      {
        model: VenueImage,
        as: 'images',
        // Use correct column names from VenueImage model: url, storageKey, isPrimary, sortOrder
        attributes: ['id', 'url', 'storageKey', 'isPrimary', 'sortOrder'],
      },
      {
        model: Review,
        as: 'reviews',
        attributes: ['id', 'rating'],
        required: false,
      },
    ],
    subQuery: false,
  });

  // Filter by distance if lat/lon provided
  if (latitude && longitude) {
    venues = venues.filter((v) => {
      if (v.latitude == null || v.longitude == null) return true;
      const dist = distanceBetween(latitude, longitude, v.latitude, v.longitude);
      return dist <= radiusKm;
    });
  }

  // Calculate average rating and pick primary image
  const enriched = venues.map((v) => {
    const reviews = (v as any).reviews ?? [];
    const sport = (v as any).sport;
    const allImages: any[] = (v as any).images ?? [];

    // Pick the primary image (or first by sortOrder) for list view
    const primaryImage =
      allImages.find((img: any) => img.isPrimary) ??
      allImages.sort((a: any, b: any) => a.sortOrder - b.sortOrder)[0] ??
      null;

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return {
      ...v.toJSON(),
      // Expose sport both inline and in sports[] array (frontend expects sports[])
      sports: sport ? [sport] : [],
      isActive: v.status === 'active',
      averageRating: avgRating,
      reviewCount: reviews.length,
      // Expose a single previewImage for list cards
      previewImage: primaryImage ? primaryImage.url : null,
      distance:
        latitude && longitude && v.latitude != null && v.longitude != null
          ? distanceBetween(latitude, longitude, v.latitude, v.longitude).toFixed(1)
          : null,
    };
  });

  // Sort
  const sorted = enriched.sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (parseFloat(b.averageRating ?? '0') || 0) - (parseFloat(a.averageRating ?? '0') || 0);
      case 'price':
        return a.pricePerHour - b.pricePerHour;
      case 'distance':
        if (!a.distance || !b.distance) return 0;
        return parseFloat(a.distance) - parseFloat(b.distance);
      case 'newest':
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      default:
        return 0;
    }
  });

  // Paginate in JS (filtering by distance already reduced the set)
  const total = sorted.length;
  const paginated = sorted.slice(offset, offset + limit);

  logger.debug('[VenueService] Listed venues', { page, limit, total, filters: { sportId, city, search } });

  return {
    data: paginated,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// ── Get single venue detail with reviews ───────────────────────────────────────

export async function getVenueDetail(venueId: string): Promise<any> {
  const venue = await Venue.findByPk(venueId, {
    include: [
      {
        model: Sport,
        as: 'sport',
        attributes: ['id', 'name', 'iconUrl'],
      },
      {
        model: Amenity,
        as: 'amenities',
        through: { attributes: [] },
        attributes: ['id', 'name', 'icon'],
      },
      {
        model: User,
        as: 'owner',
        include: [
          {
            model: OwnerProfile,
            as: 'ownerProfile',
            // OwnerProfile has: businessName, gstNumber, isApproved — no payment fields
            attributes: ['businessName', 'gstNumber', 'isApproved'],
          },
        ],
        attributes: ['id', 'name', 'email', 'phone', 'avatarUrl'],
      },
      {
        model: VenueImage,
        as: 'images',
        // Correct VenueImage columns: id, url, storageKey, isPrimary, sortOrder
        attributes: ['id', 'url', 'storageKey', 'isPrimary', 'sortOrder'],
      },
      {
        model: Review,
        as: 'reviews',
        attributes: ['id', 'rating', 'comment', 'createdAt'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatarUrl'],
          },
        ],
      },
    ],
  });

  if (!venue) {
    throw AppError.notFound('Venue');
  }

  const reviews = (venue as any).reviews ?? [];
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  // Sort images by sortOrder, primary first
  const images: any[] = ((venue as any).images ?? []).sort((a: any, b: any) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.sortOrder - b.sortOrder;
  });

  logger.debug('[VenueService] Fetched venue detail', { venueId });

  return {
    ...venue.toJSON(),
    images,
    sports: (venue as any).sport ? [(venue as any).sport] : [],
    isActive: venue.status === 'active',
    averageRating: avgRating,
    reviewCount: reviews.length,
  };
}

// ── Create venue (owner-only) ─────────────────────────────────────────────────

export async function createVenue(userId: string, input: CreateVenueInput): Promise<any> {
  // Verify user is an owner (roleId 2)
  const user = await User.findByPk(userId);
  if (!user || user.roleId !== 2) {
    throw new AppError('Only owners can create venues', 403, 'FORBIDDEN');
  }

  // Venue has a single sportId FK — not a M:M sports table
  // Use the first entry from sportIds array
  const primarySportId = input.sportIds[0];

  const venue = await Venue.create({
    ownerId: userId,
    sportId: primarySportId,
    name: input.name,
    description: input.description,
    address: input.address,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    latitude: input.latitude,
    longitude: input.longitude,
    pricePerHour: input.pricePerHour,
    phone: input.phone,
    status: VenueStatus.ACTIVE,
    isVerified: true,
  });

  // Associate amenities (M:M through venue_amenities)
  if (input.amenityIds && input.amenityIds.length > 0) {
    await (venue as any).setAmenities(input.amenityIds);
  }

  logger.info('[VenueService] Created venue', { venueId: venue.id, ownerId: userId });

  return getVenueDetail(venue.id);
}

// ── Update venue (owner-only) ─────────────────────────────────────────────────

export async function updateVenue(venueId: string, userId: string, input: UpdateVenueInput): Promise<any> {
  const venue = await Venue.findByPk(venueId);
  if (!venue) throw AppError.notFound('Venue');

  if (venue.ownerId !== userId) {
    throw new AppError('You do not own this venue', 403, 'FORBIDDEN');
  }

  // Update scalar fields
  await venue.update({
    name: input.name ?? venue.name,
    description: input.description ?? venue.description,
    pricePerHour: input.pricePerHour ?? venue.pricePerHour,
    phone: input.phone ?? (venue as any).phone,
    // sportIds[0] maps to the single sportId FK
    ...(input.sportIds && input.sportIds.length > 0 ? { sportId: input.sportIds[0] } : {}),
    status:
      input.isActive === undefined
        ? venue.status
        : input.isActive
        ? VenueStatus.ACTIVE
        : VenueStatus.SUSPENDED,
  });

  // Update amenities (M:M)
  if (input.amenityIds) {
    await (venue as any).setAmenities(input.amenityIds);
  }

  logger.info('[VenueService] Updated venue', { venueId });

  return getVenueDetail(venue.id);
}

// ── Get sports dropdown ───────────────────────────────────────────────────────

export async function getSports(): Promise<any[]> {
  return Sport.findAll({
    attributes: ['id', 'name', 'iconUrl'],
    order: [['name', 'ASC']],
  });
}

// ── Get amenities dropdown ────────────────────────────────────────────────────

export async function getAmenities(): Promise<any[]> {
  return Amenity.findAll({
    attributes: ['id', 'name', 'icon'],
    order: [['name', 'ASC']],
  });
}
