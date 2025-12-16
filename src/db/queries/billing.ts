import { db } from '@/db';
import { billingTransactions } from '@/db/schema/billing';
import { eq, desc, and } from 'drizzle-orm';

export type BillingTransaction = typeof billingTransactions.$inferSelect;
export type BillingTransactionInsert = typeof billingTransactions.$inferInsert;

export type TransactionType =
  | 'subscription_created'
  | 'subscription_renewed'
  | 'subscription_canceled'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'refund'
  | 'chargeback';

export interface CreateBillingTransactionData {
  userId: string;
  transactionType: TransactionType;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  stripeChargeId?: string;
  amount: string;
  currency?: string;
  status: string;
  description?: string;
  invoicePdfUrl?: string;
  metadata?: Record<string, unknown>;
  transactionDate: Date;
}

/**
 * Create a new billing transaction record
 * Called from Stripe webhooks to log all billing events
 */
export async function createBillingTransaction(
  data: CreateBillingTransactionData
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const [transaction] = await db
      .insert(billingTransactions)
      .values({
        userId: data.userId,
        transactionType: data.transactionType,
        stripeInvoiceId: data.stripeInvoiceId || null,
        stripePaymentIntentId: data.stripePaymentIntentId || null,
        stripeSubscriptionId: data.stripeSubscriptionId || null,
        stripeChargeId: data.stripeChargeId || null,
        amount: data.amount,
        currency: data.currency || 'usd',
        status: data.status,
        description: data.description || null,
        invoicePdfUrl: data.invoicePdfUrl || null,
        metadata: data.metadata || null,
        transactionDate: data.transactionDate,
      })
      .returning({ id: billingTransactions.id });

    return { success: true, transactionId: transaction.id };
  } catch (error) {
    console.error('Error creating billing transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create transaction',
    };
  }
}

/**
 * Get billing history for a user
 * Returns transactions sorted by date (newest first)
 */
export async function getBillingHistory(
  userId: string,
  limit = 50
): Promise<BillingTransaction[]> {
  const transactions = await db
    .select()
    .from(billingTransactions)
    .where(eq(billingTransactions.userId, userId))
    .orderBy(desc(billingTransactions.transactionDate))
    .limit(limit);

  return transactions;
}

/**
 * Get a specific transaction by ID
 * Used for transaction detail views
 */
export async function getTransactionById(
  transactionId: string
): Promise<BillingTransaction | null> {
  const [transaction] = await db
    .select()
    .from(billingTransactions)
    .where(eq(billingTransactions.id, transactionId))
    .limit(1);

  return transaction || null;
}

/**
 * Get transaction by Stripe invoice ID
 * Used to check if an invoice has already been processed
 */
export async function getTransactionByStripeInvoiceId(
  stripeInvoiceId: string
): Promise<BillingTransaction | null> {
  const [transaction] = await db
    .select()
    .from(billingTransactions)
    .where(eq(billingTransactions.stripeInvoiceId, stripeInvoiceId))
    .limit(1);

  return transaction || null;
}

/**
 * Get transactions by type for a user
 * Used for filtering transaction history
 */
export async function getTransactionsByType(
  userId: string,
  transactionType: TransactionType,
  limit = 50
): Promise<BillingTransaction[]> {
  const transactions = await db
    .select()
    .from(billingTransactions)
    .where(
      and(
        eq(billingTransactions.userId, userId),
        eq(billingTransactions.transactionType, transactionType)
      )
    )
    .orderBy(desc(billingTransactions.transactionDate))
    .limit(limit);

  return transactions;
}

/**
 * Get total spent by user
 * Sums all successful payment transactions
 */
export async function getTotalSpentByUser(userId: string): Promise<number> {
  const transactions = await db
    .select()
    .from(billingTransactions)
    .where(
      and(
        eq(billingTransactions.userId, userId),
        eq(billingTransactions.status, 'succeeded')
      )
    );

  const total = transactions.reduce((sum, transaction) => {
    return sum + parseFloat(transaction.amount);
  }, 0);

  return total;
}

