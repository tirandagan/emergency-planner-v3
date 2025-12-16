/**
 * AI Usage Queries - Type-safe Drizzle ORM queries for AI cost monitoring
 *
 * This module provides metrics for AI usage tracking:
 * - Total cost and token usage over time periods
 * - Usage breakdown by model and feature
 * - Recent AI generation activity
 * - Per-user AI usage statistics
 */

import { db } from '@/db';
import { userActivityLog } from '@/db/schema/analytics';
import { profiles } from '@/db/schema/profiles';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import type { AIUsageMetadata, AIFeature } from '@/lib/ai/usage-logger';

// ==================== TYPE DEFINITIONS ====================

export interface AIUsageSummary {
  totalCost: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  generationCount: number;
  successCount: number;
  failureCount: number;
  avgCostPerGeneration: number;
  avgTokensPerGeneration: number;
  avgDurationMs: number;
}

export interface AIUsageByModel {
  model: string;
  count: number;
  cost: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  avgDurationMs: number;
}

export interface AIUsageByFeature {
  feature: AIFeature;
  count: number;
  cost: number;
  tokens: number;
  successRate: number;
}

export interface AIUsageLogEntry {
  id: string;
  userEmail: string;
  feature: AIFeature;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  durationMs: number;
  success: boolean;
  timestamp: Date;
}

export interface AIUsageDashboard {
  summary: AIUsageSummary;
  byModel: AIUsageByModel[];
  byFeature: AIUsageByFeature[];
  recentUsage: AIUsageLogEntry[];
  lastUpdated: Date;
}

// ==================== MASTER FUNCTION ====================

/**
 * Fetch all AI usage metrics for admin dashboard
 * @param days Number of days to look back (default: 30)
 */
export async function getAIUsageDashboard(days: number = 30): Promise<AIUsageDashboard> {
  try {
    const [summary, byModel, byFeature, recentUsage] = await Promise.all([
      getAIUsageSummary(days),
      getAIUsageByModel(days),
      getAIUsageByFeature(days),
      getRecentAIUsage(20),
    ]);

    return {
      summary,
      byModel,
      byFeature,
      recentUsage,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Error fetching AI usage dashboard:', error);
    throw new Error('Failed to fetch AI usage metrics');
  }
}

// ==================== SUMMARY METRICS ====================

/**
 * Get overall AI usage summary for a time period
 * @param days Number of days to look back
 */
export async function getAIUsageSummary(days: number = 30): Promise<AIUsageSummary> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await db
      .select({ metadata: userActivityLog.metadata })
      .from(userActivityLog)
      .where(
        and(
          eq(userActivityLog.activityType, 'ai_usage'),
          gte(userActivityLog.createdAt, since)
        )
      );

    let totalCost = 0;
    let totalTokens = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalDurationMs = 0;
    let successCount = 0;
    let failureCount = 0;

    for (const log of logs) {
      const meta = log.metadata as AIUsageMetadata | null;
      if (!meta) continue;

      totalCost += meta.estimatedCostUsd || 0;
      totalTokens += meta.totalTokens || 0;
      totalInputTokens += meta.inputTokens || 0;
      totalOutputTokens += meta.outputTokens || 0;
      totalDurationMs += meta.durationMs || 0;

      if (meta.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    const generationCount = logs.length;

    return {
      totalCost,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      generationCount,
      successCount,
      failureCount,
      avgCostPerGeneration: generationCount > 0 ? totalCost / generationCount : 0,
      avgTokensPerGeneration: generationCount > 0 ? totalTokens / generationCount : 0,
      avgDurationMs: generationCount > 0 ? totalDurationMs / generationCount : 0,
    };
  } catch (error) {
    console.error('Error fetching AI usage summary:', error);
    return {
      totalCost: 0,
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      generationCount: 0,
      successCount: 0,
      failureCount: 0,
      avgCostPerGeneration: 0,
      avgTokensPerGeneration: 0,
      avgDurationMs: 0,
    };
  }
}

// ==================== BREAKDOWN BY MODEL ====================

/**
 * Get AI usage breakdown by model
 * @param days Number of days to look back
 */
export async function getAIUsageByModel(days: number = 30): Promise<AIUsageByModel[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await db
      .select({ metadata: userActivityLog.metadata })
      .from(userActivityLog)
      .where(
        and(
          eq(userActivityLog.activityType, 'ai_usage'),
          gte(userActivityLog.createdAt, since)
        )
      );

    const byModel = new Map<string, {
      count: number;
      cost: number;
      tokens: number;
      inputTokens: number;
      outputTokens: number;
      totalDurationMs: number;
    }>();

    for (const log of logs) {
      const meta = log.metadata as AIUsageMetadata | null;
      if (!meta) continue;

      const model = meta.model || 'unknown';
      const existing = byModel.get(model) || {
        count: 0,
        cost: 0,
        tokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalDurationMs: 0,
      };

      existing.count++;
      existing.cost += meta.estimatedCostUsd || 0;
      existing.tokens += meta.totalTokens || 0;
      existing.inputTokens += meta.inputTokens || 0;
      existing.outputTokens += meta.outputTokens || 0;
      existing.totalDurationMs += meta.durationMs || 0;

      byModel.set(model, existing);
    }

    return Array.from(byModel.entries())
      .map(([model, data]) => ({
        model,
        count: data.count,
        cost: data.cost,
        tokens: data.tokens,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        avgDurationMs: data.count > 0 ? data.totalDurationMs / data.count : 0,
      }))
      .sort((a, b) => b.cost - a.cost);
  } catch (error) {
    console.error('Error fetching AI usage by model:', error);
    return [];
  }
}

// ==================== BREAKDOWN BY FEATURE ====================

/**
 * Get AI usage breakdown by feature
 * @param days Number of days to look back
 */
export async function getAIUsageByFeature(days: number = 30): Promise<AIUsageByFeature[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await db
      .select({ metadata: userActivityLog.metadata })
      .from(userActivityLog)
      .where(
        and(
          eq(userActivityLog.activityType, 'ai_usage'),
          gte(userActivityLog.createdAt, since)
        )
      );

    const byFeature = new Map<AIFeature, {
      count: number;
      cost: number;
      tokens: number;
      successCount: number;
    }>();

    for (const log of logs) {
      const meta = log.metadata as AIUsageMetadata | null;
      if (!meta) continue;

      const feature = meta.feature || ('unknown' as AIFeature);
      const existing = byFeature.get(feature) || {
        count: 0,
        cost: 0,
        tokens: 0,
        successCount: 0,
      };

      existing.count++;
      existing.cost += meta.estimatedCostUsd || 0;
      existing.tokens += meta.totalTokens || 0;
      if (meta.success) {
        existing.successCount++;
      }

      byFeature.set(feature, existing);
    }

    return Array.from(byFeature.entries())
      .map(([feature, data]) => ({
        feature,
        count: data.count,
        cost: data.cost,
        tokens: data.tokens,
        successRate: data.count > 0 ? (data.successCount / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost);
  } catch (error) {
    console.error('Error fetching AI usage by feature:', error);
    return [];
  }
}

// ==================== RECENT USAGE LOG ====================

/**
 * Get recent AI usage log entries with user info
 * @param limit Number of entries to return
 */
export async function getRecentAIUsage(limit: number = 20): Promise<AIUsageLogEntry[]> {
  try {
    const logs = await db
      .select({
        id: userActivityLog.id,
        userEmail: profiles.email,
        metadata: userActivityLog.metadata,
        timestamp: userActivityLog.createdAt,
      })
      .from(userActivityLog)
      .innerJoin(profiles, eq(userActivityLog.userId, profiles.id))
      .where(eq(userActivityLog.activityType, 'ai_usage'))
      .orderBy(desc(userActivityLog.createdAt))
      .limit(limit);

    return logs.map((log) => {
      const meta = log.metadata as AIUsageMetadata | null;
      return {
        id: log.id,
        userEmail: log.userEmail,
        feature: meta?.feature || ('unknown' as AIFeature),
        model: meta?.model || 'unknown',
        inputTokens: meta?.inputTokens || 0,
        outputTokens: meta?.outputTokens || 0,
        cost: meta?.estimatedCostUsd || 0,
        durationMs: meta?.durationMs || 0,
        success: meta?.success ?? true,
        timestamp: log.timestamp,
      };
    });
  } catch (error) {
    console.error('Error fetching recent AI usage:', error);
    return [];
  }
}

// ==================== USER-SPECIFIC QUERIES ====================

/**
 * Get AI usage for a specific user
 * @param userId User ID to query
 * @param days Number of days to look back
 */
export async function getUserAIUsage(
  userId: string,
  days: number = 30
): Promise<AIUsageSummary> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await db
      .select({ metadata: userActivityLog.metadata })
      .from(userActivityLog)
      .where(
        and(
          eq(userActivityLog.userId, userId),
          eq(userActivityLog.activityType, 'ai_usage'),
          gte(userActivityLog.createdAt, since)
        )
      );

    let totalCost = 0;
    let totalTokens = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalDurationMs = 0;
    let successCount = 0;
    let failureCount = 0;

    for (const log of logs) {
      const meta = log.metadata as AIUsageMetadata | null;
      if (!meta) continue;

      totalCost += meta.estimatedCostUsd || 0;
      totalTokens += meta.totalTokens || 0;
      totalInputTokens += meta.inputTokens || 0;
      totalOutputTokens += meta.outputTokens || 0;
      totalDurationMs += meta.durationMs || 0;

      if (meta.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    const generationCount = logs.length;

    return {
      totalCost,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      generationCount,
      successCount,
      failureCount,
      avgCostPerGeneration: generationCount > 0 ? totalCost / generationCount : 0,
      avgTokensPerGeneration: generationCount > 0 ? totalTokens / generationCount : 0,
      avgDurationMs: generationCount > 0 ? totalDurationMs / generationCount : 0,
    };
  } catch (error) {
    console.error('Error fetching user AI usage:', error);
    return {
      totalCost: 0,
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      generationCount: 0,
      successCount: 0,
      failureCount: 0,
      avgCostPerGeneration: 0,
      avgTokensPerGeneration: 0,
      avgDurationMs: 0,
    };
  }
}
