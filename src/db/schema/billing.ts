import { pgTable, text, uuid, timestamp, decimal, jsonb, index } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const billingTransactions = pgTable(
  'billing_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    transactionType: text('transaction_type').notNull(),
    stripeInvoiceId: text('stripe_invoice_id'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeChargeId: text('stripe_charge_id'),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('usd'),
    status: text('status').notNull(),
    description: text('description'),
    invoicePdfUrl: text('invoice_pdf_url'),
    metadata: jsonb('metadata'),
    transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_billing_transactions_user_id').on(table.userId),
    transactionTypeIdx: index('idx_billing_transactions_transaction_type').on(
      table.transactionType
    ),
    transactionDateIdx: index('idx_billing_transactions_transaction_date').on(
      table.transactionDate
    ),
    stripeInvoiceIdIdx: index('idx_billing_transactions_stripe_invoice_id').on(
      table.stripeInvoiceId
    ),
  })
);

