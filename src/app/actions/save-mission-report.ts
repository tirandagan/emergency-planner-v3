'use server';

/**
 * Server Action to save a streamed mission report
 * Called after streaming completes to persist the generated content
 */

import { getCurrentUser } from '@/utils/supabase/server';
import { parseReportContent } from '@/lib/mission-generation/markdown-parser';
import { getEnrichedBundleData } from '@/lib/ai/bundle-context';
import { saveMissionReportV2 } from '@/lib/ai/save-mission-report-v2';
import { executeBackgroundTasks } from '@/lib/mission-generation/background-tasks';
import { generateEmergencyContacts } from '@/lib/ai/emergency-contacts-generator';
import { fetchEmergencyServices } from '@/lib/google-places';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { WizardFormData } from '@/types/wizard';
import type { ReportDataV2 } from '@/types/mission-report';

export interface SaveMissionReportInput {
  formData: WizardFormData;
  content: string;
  streamDurationMs: number;
}

export interface SaveMissionReportResult {
  success: boolean;
  reportId?: string;
  error?: string;
}

/**
 * Save a mission report from streamed content
 * Parses the markdown content into structured sections and persists to database
 */
export async function saveMissionReportFromStream(
  input: SaveMissionReportInput
): Promise<SaveMissionReportResult> {
  const { formData, content, streamDurationMs } = input;

  try {
    // Get current user from session
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Parse the completed content into structured sections
    const sections = parseReportContent(content);

    // Enrich bundle data from database
    const bundleIds = sections.bundles.map(b => b.bundleId);
    const enrichedBundles = await getEnrichedBundleData(bundleIds);

    // Merge enriched data back into sections
    for (const bundle of sections.bundles) {
      const enriched = enrichedBundles.find(e => e.id === bundle.bundleId);
      if (enriched) {
        bundle.bundleSlug = enriched.slug;
        bundle.bundleImageUrl = enriched.imageUrl || undefined;
        bundle.itemCount = enriched.itemCount;
        bundle.scenarios = enriched.scenarios;
      }
    }

    // Get user's subscription tier
    const [profile] = await db
      .select({ tier: profiles.subscriptionTier })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    const userTier = profile?.tier || 'FREE';

    // Generate emergency contacts (all tiers get some contacts)
    console.log('\n========== EMERGENCY CONTACTS GENERATION ==========');
    console.log('🚨 Generating emergency contacts...');
    console.log('📍 Location:', formData.location.city, formData.location.state);
    console.log('🗺️ Coordinates:', formData.location.coordinates);
    let emergencyContactsSection;

    try {
      // Fetch Google Places results based on user location
      console.log('🔍 Calling Google Places API...');
      const googlePlacesResults = await fetchEmergencyServices(
        formData.location.coordinates.lat,
        formData.location.coordinates.lng,
        16093, // 10 miles in meters
        ['hospital', 'police', 'fire_station', 'pharmacy', 'library', 'park']
      );

      console.log(`✅ Google Places returned ${googlePlacesResults.length} results`);
      if (googlePlacesResults.length > 0) {
        console.log('📋 Sample places:', googlePlacesResults.slice(0, 3).map(p => p.name));
      }

      // Generate AI recommendations (tier-aware)
      emergencyContactsSection = await generateEmergencyContacts(
        formData,
        user.id,
        userTier,
        googlePlacesResults
      );

      console.log(`📞 Generated ${emergencyContactsSection.contacts.length} contacts`);
    } catch (error) {
      console.error('❌ Emergency contacts generation failed:', error);
      // Continue without emergency contacts - they're not critical to plan generation
    }

    // Sanitize formData to remove non-serializable fields
    const sanitizedFormData = {
      ...formData,
      location: {
        ...formData.location,
        rawPlaceData: undefined, // Remove Google Maps API object (not serializable)
      },
    };

    // Build complete report data
    const reportData: ReportDataV2 = {
      version: '2.0',
      generatedWith: 'streaming_bundles',
      content,
      sections: {
        ...sections,
        emergencyContacts: emergencyContactsSection, // Add emergency contacts section
      },
      formData: sanitizedFormData,
      metadata: {
        model: 'anthropic/claude-3.5-sonnet', // The model used for streaming
        streamDurationMs,
        generatedAt: new Date().toISOString(),
      },
    };

    // Save to database
    const { reportId } = await saveMissionReportV2({
      userId: user.id,
      reportData,
      userTier,
    });

    // Execute background tasks (evacuation routes, etc.)
    // Fire and forget - don't block the response
    console.log('\n========== SAVE: TRIGGERING BACKGROUND TASKS ==========');
    console.log('[SAVE] Report ID:', reportId);
    console.log('[SAVE] Scenarios:', sanitizedFormData.scenarios);
    console.log('[SAVE] Location:', `${sanitizedFormData.location.city}, ${sanitizedFormData.location.state}`);
    console.log('[SAVE] Family size:', sanitizedFormData.familyMembers.length);
    console.log('========== END SAVE HEADER ==========\n');

    executeBackgroundTasks({
      reportId,
      location: sanitizedFormData.location,
      scenarios: sanitizedFormData.scenarios,
      formData: sanitizedFormData,
    }).catch(error => {
      console.error('\n========== SAVE: BACKGROUND TASKS ERROR ==========');
      console.error('[SAVE] ❌ Background tasks failed:', error);
      console.error('[SAVE] Error stack:', error.stack);
      console.error('========== END ERROR ==========\n');
      // Don't fail the whole operation if background tasks fail
    });

    return {
      success: true,
      reportId,
    };
  } catch (error) {
    console.error('Failed to save mission report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save report',
    };
  }
}
