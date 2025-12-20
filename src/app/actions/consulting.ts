'use server';

import { createClient } from '@/utils/supabase/server';
import { db } from '@/db';
import { consultingServices, consultingBookings, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateConsultingAgenda } from '@/lib/ai/consulting-agenda-generator';
import { getSystemSettingByKey } from '@/lib/consulting';
import type { NewConsultingService, NewConsultingBooking } from '@/db/schema';

/**
 * Create a new consulting booking (user initiates booking flow)
 * Saves intake responses and creates pending booking
 */
export async function createConsultingBooking(data: {
  consultingServiceId: string;
  intakeResponses: Record<string, string>;
}): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized - please log in to book a consultation' };
    }

    // Get current hourly rate from system settings
    const hourlyRateStr = await getSystemSettingByKey('consulting_hourly_rate');
    const hourlyRate = hourlyRateStr ? parseFloat(hourlyRateStr) : 150;

    const [booking] = await db
      .insert(consultingBookings)
      .values({
        userId: user.id,
        consultingServiceId: data.consultingServiceId,
        intakeResponses: data.intakeResponses,
        hourlyRateAtBooking: hourlyRate.toString(),
        status: 'pending',
      })
      .returning();

    revalidatePath('/consulting/my-bookings', 'page');

    return { success: true, bookingId: booking.id };
  } catch (error) {
    console.error('Failed to create consulting booking:', error);
    return { success: false, error: 'Failed to create booking. Please try again.' };
  }
}

/**
 * Generate AI-powered agenda for a consulting booking
 * Updates booking with generated agenda and estimated cost
 */
export async function generateAgendaForBooking(
  bookingId: string
): Promise<{ success: boolean; agenda?: string; estimatedDuration?: number; estimatedCost?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify user owns this booking
    const [booking] = await db
      .select()
      .from(consultingBookings)
      .where(eq(consultingBookings.id, bookingId))
      .limit(1);

    if (!booking || booking.userId !== user.id) {
      return { success: false, error: 'Booking not found or access denied' };
    }

    // Generate agenda using AI
    const { agenda, estimatedDuration } = await generateConsultingAgenda(bookingId);

    // Calculate estimated cost
    const hourlyRate = parseFloat(booking.hourlyRateAtBooking);
    const estimatedCost = (estimatedDuration / 60) * hourlyRate;

    // Update booking with generated agenda
    await db
      .update(consultingBookings)
      .set({
        generatedAgenda: agenda,
        agendaGeneratedAt: new Date(),
        estimatedDurationMinutes: estimatedDuration,
        totalEstimatedCost: estimatedCost.toFixed(2),
      })
      .where(eq(consultingBookings.id, bookingId));

    revalidatePath(`/consulting/booking/${bookingId}`, 'page');

    return { success: true, agenda, estimatedDuration, estimatedCost };
  } catch (error) {
    console.error('Failed to generate agenda:', error);
    return { success: false, error: 'Failed to generate agenda. Please try again.' };
  }
}

/**
 * Update consulting booking status
 * Used by users (cancel) or admins (scheduled, completed, no_show)
 */
export async function updateConsultingBookingStatus(
  bookingId: string,
  status: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership or admin role
    const [booking] = await db
      .select()
      .from(consultingBookings)
      .where(eq(consultingBookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    const isAdmin = profile?.role === 'ADMIN';
    const isOwner = booking.userId === user.id;

    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Access denied' };
    }

    // Users can only cancel their own bookings
    if (isOwner && !isAdmin && status !== 'cancelled') {
      return { success: false, error: 'Users can only cancel bookings' };
    }

    await db
      .update(consultingBookings)
      .set({
        status,
        adminNotes: adminNotes || booking.adminNotes,
        scheduledAt: status === 'scheduled' ? new Date() : booking.scheduledAt,
      })
      .where(eq(consultingBookings.id, bookingId));

    revalidatePath('/consulting/my-bookings', 'page');
    revalidatePath('/admin/consulting/bookings', 'page');

    return { success: true };
  } catch (error) {
    console.error('Failed to update booking status:', error);
    return { success: false, error: 'Failed to update status. Please try again.' };
  }
}

// ==================== ADMIN-ONLY ACTIONS ====================

/**
 * Create a new consulting service offering (admin only)
 */
export async function createConsultingService(
  data: Omit<NewConsultingService, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; serviceId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check admin role
    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (profile?.role !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    const [service] = await db.insert(consultingServices).values(data).returning();

    revalidatePath('/admin/consulting', 'page');
    revalidatePath('/consulting', 'page');

    return { success: true, serviceId: service.id };
  } catch (error) {
    console.error('Failed to create consulting service:', error);
    return { success: false, error: 'Failed to create service. Please try again.' };
  }
}

/**
 * Update an existing consulting service (admin only)
 */
export async function updateConsultingService(
  serviceId: string,
  data: Partial<Omit<NewConsultingService, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (profile?.role !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    await db
      .update(consultingServices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(consultingServices.id, serviceId));

    revalidatePath('/admin/consulting', 'page');
    revalidatePath('/consulting', 'page');

    return { success: true };
  } catch (error) {
    console.error('Failed to update consulting service:', error);
    return { success: false, error: 'Failed to update service. Please try again.' };
  }
}

/**
 * Delete a consulting service (admin only)
 * Note: Will fail if there are active bookings (FK constraint)
 */
export async function deleteConsultingService(
  serviceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (profile?.role !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    await db.delete(consultingServices).where(eq(consultingServices.id, serviceId));

    revalidatePath('/admin/consulting', 'page');
    revalidatePath('/consulting', 'page');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete consulting service:', error);

    // Check if error is due to foreign key constraint (active bookings exist)
    if (error?.code === '23503') {
      return {
        success: false,
        error: 'Cannot delete service with existing bookings. Set as inactive instead.',
      };
    }

    return { success: false, error: 'Failed to delete service. Please try again.' };
  }
}
