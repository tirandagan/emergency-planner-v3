'use server';

import { db } from '@/db';
import { missionReports } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateEvacuationRoutes, shouldGenerateRoutes } from './evacuation-routes';
import type { EvacuationRoute } from '@/types/mission-report';
import type { LocationData, ScenarioType, WizardFormData } from '@/types/wizard';

/**
 * Input for background task execution
 */
interface BackgroundTaskInput {
  reportId: string;
  location: LocationData;
  scenarios: ScenarioType[];
  formData: WizardFormData;
  mobility?: 'BUG_IN' | 'BUG_OUT' | 'FLEXIBLE'; // Will be added to wizard in future
}

/**
 * Result of background task execution
 */
interface BackgroundTaskResult {
  success: boolean;
  routesGenerated: boolean;
  routeCount?: number;
  durationMs: number;
  error?: string;
}

/**
 * Execute background tasks after core report generation
 * Currently supports:
 * - Evacuation route generation (if applicable)
 *
 * Future additions:
 * - Skill resource matching
 * - Weather data integration
 */
export async function executeBackgroundTasks(
  input: BackgroundTaskInput
): Promise<BackgroundTaskResult> {
  const startTime = Date.now();
  const tasks: Promise<void>[] = [];
  let routesGenerated = false;
  let routeCount = 0;

  console.log('\n========== BACKGROUND TASKS: STARTING ==========');
  console.log('[BG-TASKS] Report ID:', input.reportId);
  console.log('[BG-TASKS] Location:', `${input.location.city}, ${input.location.state}`);
  console.log('[BG-TASKS] Scenarios:', input.scenarios);
  console.log('[BG-TASKS] Family members:', input.formData.familyMembers.length);
  console.log('[BG-TASKS] Mobility:', input.mobility);
  console.log('========== END BACKGROUND TASKS HEADER ==========\n');

  try {
    // First, check if routes already exist
    console.log('[BG-TASKS] 🔍 Checking existing route status...');
    const existingStatus = await checkRoutesStatus(input.reportId);
    console.log('[BG-TASKS] Existing status:', {
      ready: existingStatus.ready,
      routeCount: existingStatus.routes?.length ?? 0
    });

    if (existingStatus.ready) {
      // Routes already exist, skip generation
      console.log('[BG-TASKS] ✅ Routes already exist, skipping generation');
      return {
        success: true,
        routesGenerated: false,
        routeCount: existingStatus.routes?.length ?? 0,
        durationMs: Date.now() - startTime,
      };
    }

    // Determine if routes should be generated
    // Uses scenario-based inference until mobility field is added to wizard
    const scenarioNeedsRoutes = await shouldGenerateRoutes(input.scenarios);
    console.log('[BG-TASKS] 📊 Scenario needs routes:', scenarioNeedsRoutes);

    // Generate routes if scenario suggests evacuation might be needed
    // This includes EMP scenarios even in BUG_IN mode (routes are backup plans)
    const shouldGenerate = scenarioNeedsRoutes;

    console.log('[BG-TASKS] 🎯 Should generate routes:', shouldGenerate, {
      mobility: input.mobility,
      scenarioNeedsRoutes
    });

    if (shouldGenerate) {
      console.log('\n[BG-TASKS] ✅ WILL GENERATE ROUTES\n');
      tasks.push(
        generateAndSaveRoutes(input.reportId, input.location, input.scenarios, input.formData)
          .then(count => {
            console.log('\n[BG-TASKS] ✅ Routes generated successfully, count:', count, '\n');
            routesGenerated = true;
            routeCount = count;
          })
          .catch(err => {
            console.error('\n[BG-TASKS] ❌ Route generation failed:', err);
            console.error('Error stack:', err.stack, '\n');
            throw err;
          })
      );
    } else {
      console.log('\n[BG-TASKS] ⏭️  SKIPPING route generation (mobility or scenarios don\'t require routes)\n');
      // If routes don't need to be generated, mark as complete with empty array
      tasks.push(
        updateReportRoutes(input.reportId, [])
          .then(() => {
            console.log('[BG-TASKS] ✅ Empty routes array saved');
            routesGenerated = false;
            routeCount = 0;
          })
          .catch(err => {
            console.error('[BG-TASKS] ❌ Failed to save empty routes:', err);
            throw err;
          })
      );
    }

    // Execute all tasks with a timeout
    console.log('[BG-TASKS] ⏳ Waiting for tasks to complete...');
    await Promise.race([
      Promise.allSettled(tasks),
      new Promise(resolve => setTimeout(() => {
        console.log('[BG-TASKS] ⚠️  Timeout reached (20s)');
        resolve([]);
      }, 20000))
    ]);

    console.log('[BG-TASKS] 🎉 Background tasks completed', {
      routesGenerated,
      routeCount,
      durationMs: Date.now() - startTime
    });

    return {
      success: true,
      routesGenerated,
      routeCount,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('[BG-TASKS] ❌ Background task error:', error);
    return {
      success: false,
      routesGenerated: false,
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate evacuation routes and save to report
 */
async function generateAndSaveRoutes(
  reportId: string,
  location: LocationData,
  scenarios: ScenarioType[],
  formData: WizardFormData
): Promise<number> {
  console.log(`\n🗺️  Generating routes for ${location.city}, ${location.state} (${formData.familyMembers.length} family members)`);

  const routes = await generateEvacuationRoutes(location, scenarios, formData);

  await updateReportRoutes(reportId, routes);
  console.log(`✅ Saved ${routes.length} routes to database\n`);

  return routes.length;
}

/**
 * Update report with evacuation routes
 */
async function updateReportRoutes(
  reportId: string,
  routes: EvacuationRoute[]
): Promise<void> {
  console.log('[DB] 💾 Updating report with routes:', {
    reportId,
    routeCount: routes.length
  });

  try {
    // Save routes to separate evacuationRoutes field
    const result = await db
      .update(missionReports)
      .set({
        evacuationRoutes: routes,
        updatedAt: new Date(),
      })
      .where(eq(missionReports.id, reportId))
      .returning({ id: missionReports.id });

    console.log('[DB] ✅ Database update successful:', {
      reportId: result[0]?.id,
      updated: result.length > 0
    });
  } catch (error) {
    console.error('[DB] ❌ Database update failed:', error);
    throw error;
  }
}

/**
 * Check if routes are ready for a report
 */
export async function checkRoutesStatus(reportId: string): Promise<{
  ready: boolean;
  routes?: EvacuationRoute[];
}> {
  console.log('[DB] 🔍 Checking route status for report:', reportId);

  const [report] = await db
    .select({ evacuationRoutes: missionReports.evacuationRoutes })
    .from(missionReports)
    .where(eq(missionReports.id, reportId))
    .limit(1);

  if (!report) {
    console.log('[DB] ❌ Report not found');
    return { ready: false };
  }

  console.log('[DB] Report found:', {
    hasEvacuationRoutesField: 'evacuationRoutes' in report,
    evacuationRoutesValue: report.evacuationRoutes === undefined ? 'undefined' :
                            report.evacuationRoutes === null ? 'null' :
                            `array[${(report.evacuationRoutes as EvacuationRoute[])?.length}]`
  });

  // Check if routes have been generated
  // null or undefined = not yet generated (PostgreSQL default is NULL)
  // [] = generation complete but no routes needed
  // [...] = routes generated
  // FIXED: null check added to prevent treating default null as "ready"
  if (report.evacuationRoutes !== undefined && report.evacuationRoutes !== null) {
    const routeCount = (report.evacuationRoutes as EvacuationRoute[])?.length ?? 0;
    console.log('[DB] ✅ Routes ready:', { routeCount });
    return {
      ready: true,
      routes: (report.evacuationRoutes as EvacuationRoute[]) ?? []
    };
  }

  console.log('[DB] ⏳ Routes not ready yet (null or undefined)');
  return { ready: false };
}
