'use server';

/**
 * Server Actions for managing family member locations in mission reports
 * Operates on the userEnrichments.familyMembers JSONB array
 */

import { getCurrentUser } from '@/utils/supabase/server';
import { db } from '@/db';
import { missionReports } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import type { UserEnrichments } from '@/db/schema';

export interface FamilyMemberInput {
  name: string;
  relationship: string;
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  phone?: string;
}

export interface ServerActionResult {
  success: boolean;
  error?: string;
}

/**
 * Add a family member location to a mission report
 */
export async function addFamilyMember(
  reportId: string,
  memberData: FamilyMemberInput
): Promise<ServerActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify user owns this report
    const [report] = await db
      .select({
        id: missionReports.id,
        userEnrichments: missionReports.userEnrichments,
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
      return { success: false, error: 'Report not found or access denied' };
    }

    // Get existing enrichments or create new structure
    const enrichments = (report.userEnrichments as UserEnrichments) || {
      familyMembers: [],
      notes: [],
    };

    // Add new family member with generated ID
    const newMember = {
      id: uuidv4(),
      ...memberData,
    };

    enrichments.familyMembers.push(newMember);

    // Update database
    await db
      .update(missionReports)
      .set({ userEnrichments: enrichments })
      .where(eq(missionReports.id, reportId));

    // Revalidate plan detail page
    revalidatePath(`/plans/${reportId}`, 'page');

    return { success: true };
  } catch (error) {
    console.error('Failed to add family member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add family member',
    };
  }
}

/**
 * Update an existing family member location
 */
export async function updateFamilyMember(
  reportId: string,
  memberId: string,
  memberData: Partial<FamilyMemberInput>
): Promise<ServerActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify user owns this report
    const [report] = await db
      .select({
        id: missionReports.id,
        userEnrichments: missionReports.userEnrichments,
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
      return { success: false, error: 'Report not found or access denied' };
    }

    const enrichments = (report.userEnrichments as UserEnrichments) || {
      familyMembers: [],
      notes: [],
    };

    // Find and update the family member
    const memberIndex = enrichments.familyMembers.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
      return { success: false, error: 'Family member not found' };
    }

    enrichments.familyMembers[memberIndex] = {
      ...enrichments.familyMembers[memberIndex],
      ...memberData,
    };

    // Update database
    await db
      .update(missionReports)
      .set({ userEnrichments: enrichments })
      .where(eq(missionReports.id, reportId));

    // Revalidate plan detail page
    revalidatePath(`/plans/${reportId}`, 'page');

    return { success: true };
  } catch (error) {
    console.error('Failed to update family member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update family member',
    };
  }
}

/**
 * Remove a family member location from a mission report
 */
export async function deleteFamilyMember(
  reportId: string,
  memberId: string
): Promise<ServerActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify user owns this report
    const [report] = await db
      .select({
        id: missionReports.id,
        userEnrichments: missionReports.userEnrichments,
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
      return { success: false, error: 'Report not found or access denied' };
    }

    const enrichments = (report.userEnrichments as UserEnrichments) || {
      familyMembers: [],
      notes: [],
    };

    // Remove the family member
    enrichments.familyMembers = enrichments.familyMembers.filter(
      m => m.id !== memberId
    );

    // Update database
    await db
      .update(missionReports)
      .set({ userEnrichments: enrichments })
      .where(eq(missionReports.id, reportId));

    // Revalidate plan detail page
    revalidatePath(`/plans/${reportId}`, 'page');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete family member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete family member',
    };
  }
}

/**
 * Get all family members for a mission report
 */
export async function getFamilyMembers(
  reportId: string
): Promise<{ success: boolean; members?: UserEnrichments['familyMembers']; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify user owns this report
    const [report] = await db
      .select({
        userEnrichments: missionReports.userEnrichments,
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
      return { success: false, error: 'Report not found or access denied' };
    }

    const enrichments = (report.userEnrichments as UserEnrichments) || {
      familyMembers: [],
      notes: [],
    };

    return { success: true, members: enrichments.familyMembers };
  } catch (error) {
    console.error('Failed to get family members:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get family members',
    };
  }
}
