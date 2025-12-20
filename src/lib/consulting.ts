import { db } from '@/db';
import { consultingServices, consultingBookings, profiles, bundles } from '@/db/schema';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';

/**
 * Get all active consulting services with optional filters
 * Used for public consulting discovery and targeted recommendations
 */
export async function getActiveConsultingServices(filters?: {
  isGeneric?: boolean;
  bundleId?: string;
  targetScenarios?: string[];
}) {
  const conditions = [eq(consultingServices.isActive, true)];

  if (filters?.isGeneric !== undefined) {
    conditions.push(eq(consultingServices.isGeneric, filters.isGeneric));
  }

  if (filters?.bundleId) {
    conditions.push(eq(consultingServices.bundleId, filters.bundleId));
  }

  const services = await db
    .select()
    .from(consultingServices)
    .where(and(...conditions))
    .orderBy(consultingServices.displayOrder);

  // Filter by target scenarios in memory (array operations are complex in SQL)
  if (filters?.targetScenarios && filters.targetScenarios.length > 0) {
    return services.filter((service: typeof consultingServices.$inferSelect) => {
      if (!service.targetScenarios || service.targetScenarios.length === 0) {
        return true; // Generic services match all scenarios
      }
      return service.targetScenarios.some((scenario: string) =>
        filters.targetScenarios!.includes(scenario)
      );
    });
  }

  return services;
}

/**
 * Get a single consulting service by ID
 */
export async function getConsultingServiceById(id: string) {
  const [service] = await db
    .select()
    .from(consultingServices)
    .where(eq(consultingServices.id, id))
    .limit(1);

  return service || null;
}

/**
 * Get all consulting bookings for a specific user
 * Includes service details and ordered by most recent first
 */
export async function getUserConsultingBookings(userId: string) {
  const results = await db
    .select({
      booking: consultingBookings,
      service: consultingServices,
    })
    .from(consultingBookings)
    .leftJoin(
      consultingServices,
      eq(consultingBookings.consultingServiceId, consultingServices.id)
    )
    .where(eq(consultingBookings.userId, userId))
    .orderBy(desc(consultingBookings.createdAt));

  return results;
}

/**
 * Get a single consulting booking by ID with full context
 * Includes service details and user information
 */
export async function getConsultingBookingById(id: string) {
  const [result] = await db
    .select({
      booking: consultingBookings,
      service: consultingServices,
      user: profiles,
    })
    .from(consultingBookings)
    .leftJoin(
      consultingServices,
      eq(consultingBookings.consultingServiceId, consultingServices.id)
    )
    .leftJoin(profiles, eq(consultingBookings.userId, profiles.id))
    .where(eq(consultingBookings.id, id))
    .limit(1);

  return result || null;
}

/**
 * Get all consulting bookings for admin review
 * Includes user and service details with optional filters
 */
export async function getAllConsultingBookingsForAdmin(filters?: {
  status?: string;
  serviceId?: string;
}) {
  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(consultingBookings.status, filters.status));
  }

  if (filters?.serviceId) {
    conditions.push(eq(consultingBookings.consultingServiceId, filters.serviceId));
  }

  const results = await db
    .select({
      booking: consultingBookings,
      service: consultingServices,
      user: profiles,
    })
    .from(consultingBookings)
    .leftJoin(
      consultingServices,
      eq(consultingBookings.consultingServiceId, consultingServices.id)
    )
    .leftJoin(profiles, eq(consultingBookings.userId, profiles.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(consultingBookings.createdAt));

  return results;
}

/**
 * Get consulting services for admin management
 * Includes bundle details and count of bookings
 */
export async function getAllConsultingServicesForAdmin() {
  const servicesWithDetails = await db
    .select({
      service: consultingServices,
      bundle: bundles,
      bookingCount: sql<number>`count(${consultingBookings.id})::int`,
    })
    .from(consultingServices)
    .leftJoin(bundles, eq(consultingServices.bundleId, bundles.id))
    .leftJoin(
      consultingBookings,
      eq(consultingServices.id, consultingBookings.consultingServiceId)
    )
    .groupBy(consultingServices.id, bundles.id)
    .orderBy(consultingServices.displayOrder);

  return servicesWithDetails;
}

/**
 * Get a system setting by key
 * Used for fetching consulting-related settings (hourly rate, Calendly URL)
 */
export async function getSystemSettingByKey(key: string) {
  const { systemSettings } = await import('@/db/schema');

  const [setting] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);

  return setting?.value || null;
}
