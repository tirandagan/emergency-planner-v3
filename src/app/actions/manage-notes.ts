'use server';

/**
 * Server Actions for managing notes in mission reports
 * Operates on the userEnrichments.notes JSONB array
 */

import { getCurrentUser } from '@/utils/supabase/server';
import { db } from '@/db';
import { missionReports } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import type { UserEnrichments } from '@/db/schema';

export type NoteSectionType = 'contact' | 'bundle' | 'skill' | 'general';

export interface NoteInput {
  sectionType: NoteSectionType;
  targetId?: string; // ID of the related item (contact, bundle, skill)
  content: string;
}

export interface ServerActionResult {
  success: boolean;
  error?: string;
}

/**
 * Add a note to a mission report
 */
export async function addNote(
  reportId: string,
  noteData: NoteInput
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

    // Add new note with generated ID and timestamp
    const newNote = {
      id: uuidv4(),
      ...noteData,
      createdAt: new Date().toISOString(),
    };

    enrichments.notes.push(newNote);

    // Update database
    await db
      .update(missionReports)
      .set({ userEnrichments: enrichments })
      .where(eq(missionReports.id, reportId));

    // Revalidate plan detail page
    revalidatePath(`/plans/${reportId}`, 'page');

    return { success: true };
  } catch (error) {
    console.error('Failed to add note:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add note',
    };
  }
}

/**
 * Update an existing note
 */
export async function updateNote(
  reportId: string,
  noteId: string,
  content: string
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

    // Find and update the note
    const noteIndex = enrichments.notes.findIndex(n => n.id === noteId);
    if (noteIndex === -1) {
      return { success: false, error: 'Note not found' };
    }

    enrichments.notes[noteIndex] = {
      ...enrichments.notes[noteIndex],
      content,
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
    console.error('Failed to update note:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update note',
    };
  }
}

/**
 * Delete a note from a mission report
 */
export async function deleteNote(
  reportId: string,
  noteId: string
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

    // Remove the note
    enrichments.notes = enrichments.notes.filter(n => n.id !== noteId);

    // Update database
    await db
      .update(missionReports)
      .set({ userEnrichments: enrichments })
      .where(eq(missionReports.id, reportId));

    // Revalidate plan detail page
    revalidatePath(`/plans/${reportId}`, 'page');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete note:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete note',
    };
  }
}

/**
 * Get all notes for a mission report
 * Optional: filter by section type or target ID
 */
export async function getNotes(
  reportId: string,
  filters?: {
    sectionType?: NoteSectionType;
    targetId?: string;
  }
): Promise<{ success: boolean; notes?: UserEnrichments['notes']; error?: string }> {
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

    let notes = enrichments.notes;

    // Apply filters if provided
    if (filters) {
      if (filters.sectionType) {
        notes = notes.filter(n => n.sectionType === filters.sectionType);
      }
      if (filters.targetId) {
        notes = notes.filter(n => n.targetId === filters.targetId);
      }
    }

    return { success: true, notes };
  } catch (error) {
    console.error('Failed to get notes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get notes',
    };
  }
}

/**
 * Get notes for a specific section target
 * Convenience wrapper for getNotes with targetId filter
 */
export async function getNotesForTarget(
  reportId: string,
  targetId: string
): Promise<{ success: boolean; notes?: UserEnrichments['notes']; error?: string }> {
  return getNotes(reportId, { targetId });
}

/**
 * Get notes by section type
 * Convenience wrapper for getNotes with sectionType filter
 */
export async function getNotesBySection(
  reportId: string,
  sectionType: NoteSectionType
): Promise<{ success: boolean; notes?: UserEnrichments['notes']; error?: string }> {
  return getNotes(reportId, { sectionType });
}
