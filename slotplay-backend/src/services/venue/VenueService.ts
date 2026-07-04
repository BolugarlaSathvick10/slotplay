/**
 * services/venue/VenueService.ts
 *
 * Business logic for venue operations.
 * Controllers call this — they never touch models directly.
 */

import { Op, Sequelize } from 'sequelize';
import { Venue, Sport, Amenity, Review, OwnerProfile, User, VenueImage } from '@/models';







import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';
import type { ListVenuesInput, CreateVenueInput, UpdateVenueInput } from '@/validators/venue.validators';

// ── Haversine distance calculation (km) ──────────────────────────────────────

function distanceBetween(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
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
  const where: any = { isActive: true };
  if (city) where.city = { [Op.iLike]: `%${city}%` };
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Fetch venues
  let venues = await Venue.findAll({
    where,
    include: [
      {
        model: Sport,
        as: 'sports',
        where: sportId ? { id: sportId } : undefined,
        through: { attributes: [] },
        attributes: ['id', 'name', 'icon'],
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
        attributes: ['id', 'imageUrl', 'category'],
        limit: 1,
        order: [['createdAt', 'ASC']],
      },
      {
        model: Review,
        as: 'reviews',
        attributes: ['id', 'rating'],
        required: false,
      },
    ],
    distinct: true,
    subQuery: false,
  });

  // Filter by distance if lat/lon provided
  if (latitude && longitude) {
    venues = venues.filter((v) => {
      const dist = distanceBetween(latitude, longitude, v.latitude, v.longitude);
      return dist <= radiusKm;
    });
  }

  // Calculate average rating for each venue
  const enriched = venues.map((v) => {
    const reviews = v.reviews as any[];
    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;
    return {
      ...v.toJSON(),
      averageRating: avgRating,
      reviewCount: reviews.length,
      distance:
        latitude && longitude
          ? distanceBetween(latitude, longitude, v.latitude, v.longitude).toFixed(1)
          : null,
    };
  });

  // Sort
  const sorted = enriched.sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.averageRating || 0) - (a.averageRating || 0);
      case 'price':
        return a.pricePerHour - b.pricePerHour;
      case 'distance':
        if (!a.distance || !b.distance) return 0;
        return parseFloat(a.distance) - parseFloat(b.distance);
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  // Paginate
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
        as: 'sports',
        through: { attributes: [] },
        attributes: ['id', 'name', 'icon'],
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
            attributes: ['upiId', 'bankAccountHolder', 'bankName'],
          },
        ],
        attributes: ['id', 'name', 'email', 'phone', 'avatarUrl'],
      },
      {
        model: VenueImage,
        as: 'images',
        attributes: ['id', 'imageUrl', 'category'],
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
        order: [['createdAt', 'DESC']],
        limit: 10,
      },
    ],
  });

  if (!venue) {
    throw AppError.notFound('Venue');
  }

  // Calculate average rating
  const reviews = venue.reviews as any[];
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  logger.debug('[VenueService] Fetched venue detail', { venueId });

  return {
    ...venue.toJSON(),
    averageRating: avgRating,
    reviewCount: reviews.length,
  };
}

// ── Create venue (owner-only) ─────────────────────────────────────────────────

export async function createVenue(userId: string, input: CreateVenueInput): Promise<any> {
  // Verify user is an owner
  const user = await User.findByPk(userId);
  if (!user || user.roleId !== 2) {
    throw new AppError('Only owners can create venues', 403, 'FORBIDDEN');
  }

  // Create venue
  const venue = await Venue.create({
    ownerId: userId,
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
    isActive: true,
  });

  // Associate sports
  if (input.sportIds.length > 0) {
    await venue.addSports(input.sportIds);
  }

  // Associate amenities
  if (input.amenityIds && input.amenityIds.length > 0) {
    await venue.addAmenities(input.amenityIds);
  }

  logger.info('[VenueService] Created venue', { venueId: venue.id, ownerId: userId });

  return venue;
}

// ── Update venue (owner-only) ─────────────────────────────────────────────────

export async function updateVenue(venueId: string, userId: string, input: UpdateVenueInput): Promise<any> {
  const venue = await Venue.findByPk(venueId);
  if (!venue) throw AppError.notFound('Venue');

  // Verify ownership
  if (venue.ownerId !== userId) {
    throw new AppError('You do not own this venue', 403, 'FORBIDDEN');
  }

  // Update fields
  await venue.update({
    name: input.name ?? venue.name,
    description: input.description ?? venue.description,
    pricePerHour: input.pricePerHour ?? venue.pricePerHour,
    phone: input.phone ?? venue.phone,
    isActive: input.isActive ?? venue.isActive,
  });

  // Update sports if provided
  if (input.sportIds) {
    await venue.setSports(input.sportIds);
  }

  // Update amenities if provided
  if (input.amenityIds) {
    await venue.setAmenities(input.amenityIds);
  }

  logger.info('[VenueService] Updated venue', { venueId });

  return venue;
}

// ── Get sports dropdown ───────────────────────────────────────────────────────

export async function getSports(): Promise<any[]> {
  return Sport.findAll({
    attributes: ['id', 'name', 'icon'],
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
