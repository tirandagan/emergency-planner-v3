'use server';

/**
 * Server Action to regenerate emergency contacts for an existing mission report
 * Useful for testing Google Places integration or refreshing contacts
 */

import { getCurrentUser } from '@/utils/supabase/server';
import { db } from '@/db';
import { missionReports, profiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateEmergencyContacts } from '@/lib/ai/emergency-contacts-generator';
import { fetchEmergencyServices } from '@/lib/google-places';
import type { ReportDataV2 } from '@/types/mission-report';

export interface RegenerateContactsResult {
  success: boolean;
  contactCount?: number;
  error?: string;
}

/**
 * Regenerate emergency contacts for an existing mission report
 */
export async function regenerateEmergencyContacts(
  reportId: string
): Promise<RegenerateContactsResult> {
  try {
    console.log('\n========== REGENERATING EMERGENCY CONTACTS ==========');
    console.log('📋 Report ID:', reportId);

    // Get current user from session
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Fetch the mission report and verify ownership
    const [report] = await db
      .select({
        id: missionReports.id,
        userId: missionReports.userId,
        reportData: missionReports.reportData,
      })
      .from(missionReports)
      .where(
        and(
          eq(missionReports.id, reportId),
          eq(missionReports.userId, user.id)
        )
      )
      .limit(1);

    if (!report) {
      return {
        success: false,
        error: 'Report not found or access denied',
      };
    }

    const reportData = report.reportData as ReportDataV2;

    // Validate that this is a V2 report with formData
    if (!reportData.formData) {
      return {
        success: false,
        error: 'Cannot regenerate contacts for legacy reports',
      };
    }

    // Get user's subscription tier
    const [profile] = await db
      .select({ tier: profiles.subscriptionTier })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    const userTier = profile?.tier || 'FREE';

    console.log('📍 Location:', reportData.formData.location.city, reportData.formData.location.state);
    console.log('🗺️ Coordinates:', reportData.formData.location.coordinates);
    console.log('👤 User Tier:', userTier);

    // Fetch Google Places results
    console.log('🔍 Calling Google Places API...');
    const googlePlacesResults = await fetchEmergencyServices(
      reportData.formData.location.coordinates.lat,
      reportData.formData.location.coordinates.lng,
      16093, // 10 miles in meters
      ['hospital', 'police', 'fire_station', 'pharmacy', 'library', 'park']
    );

    console.log(`✅ Google Places returned ${googlePlacesResults.length} results`);
    if (googlePlacesResults.length > 0) {
      console.log('📋 Sample places:', googlePlacesResults.slice(0, 3).map(p => p.name));
    } else {
      console.warn('⚠️ No Google Places results - will use static contacts only');
    }

    // Generate AI recommendations (tier-aware)
    const emergencyContactsSection = await generateEmergencyContacts(
      reportData.formData,
      user.id,
      userTier,
      googlePlacesResults
    );

    console.log(`📞 Generated ${emergencyContactsSection.contacts.length} contacts`);
    console.log(`📍 Generated ${emergencyContactsSection.meetingLocations.length} meeting locations`);

    // Update the report with new emergency contacts
    const updatedReportData: ReportDataV2 = {
      ...reportData,
      sections: {
        ...reportData.sections,
        emergencyContacts: emergencyContactsSection,
      },
    };

    await db
      .update(missionReports)
      .set({
        reportData: updatedReportData,
        updatedAt: new Date(),
      })
      .where(eq(missionReports.id, reportId));

    console.log('✅ Emergency contacts updated successfully');
    console.log('========== END REGENERATION ==========\n');

    // Revalidate the plan detail page
    revalidatePath(`/plans/${reportId}`, 'page');

    return {
      success: true,
      contactCount: emergencyContactsSection.contacts.length,
    };
  } catch (error) {
    console.error('❌ Failed to regenerate emergency contacts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate contacts',
    };
  }
}
