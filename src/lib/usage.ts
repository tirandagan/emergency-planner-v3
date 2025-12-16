import { db } from '@/db';
import { profiles, missionReports, billingTransactions } from '@/db/schema';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';

export interface UsageMetrics {
  lastLoginAt: Date | null;
  plansCreated: number;
  totalTokensUsed: number;
}

export interface BillingTransaction {
  id: string;
  transactionType: 'subscription_payment' | 'refund' | 'credit';
  amount: string;
  currency: string;
  status: string;
  description: string | null;
  transactionDate: Date;
  invoicePdfUrl: string | null;
  stripeInvoiceId: string | null;
}

export interface BillingHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  transactionType?: 'all' | 'subscription_payment' | 'refund' | 'credit';
  page: number;
  pageSize: number;
}

/**
 * Get user usage metrics (last login, plans created, token usage)
 */
export async function getUserUsageMetrics(userId: string): Promise<UsageMetrics> {
  try {
    // Get user data with only needed fields
    const [user] = await db
      .select({
        lastLoginAt: profiles.lastLoginAt,
        totalTokensUsed: profiles.totalTokensUsed,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    // Get plans count
    const [plansResult] = await db
      .select({ count: count() })
      .from(missionReports)
      .where(eq(missionReports.userId, userId));

    return {
      lastLoginAt: user?.lastLoginAt || null,
      plansCreated: Number(plansResult?.count) || 0,
      totalTokensUsed: user?.totalTokensUsed || 0,
    };
  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    // Return default values on error
    return {
      lastLoginAt: null,
      plansCreated: 0,
      totalTokensUsed: 0,
    };
  }
}

/**
 * Get paginated billing transaction history with filters
 */
export async function getBillingTransactions(
  userId: string,
  filters: BillingHistoryFilters
): Promise<{ transactions: BillingTransaction[]; total: number }> {
  try {
    const conditions = [eq(billingTransactions.userId, userId)];

    if (filters.startDate) {
      conditions.push(gte(billingTransactions.transactionDate, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(billingTransactions.transactionDate, filters.endDate));
    }

    if (filters.transactionType && filters.transactionType !== 'all') {
      conditions.push(eq(billingTransactions.transactionType, filters.transactionType));
    }

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(billingTransactions)
      .where(and(...conditions));

    // Get transactions
    const transactions = await db
      .select()
      .from(billingTransactions)
      .where(and(...conditions))
      .orderBy(desc(billingTransactions.transactionDate))
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    return {
      transactions: transactions as BillingTransaction[],
      total: Number(totalResult?.count) || 0,
    };
  } catch (error) {
    console.error('Error fetching billing transactions:', error);
    // Return empty results on error
    return {
      transactions: [],
      total: 0,
    };
  }
}
