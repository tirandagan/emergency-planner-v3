import { pgTable, text, uuid, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  contactInfo: jsonb('contact_info').$type<{
    email?: string;
    phone?: string;
    address?: string;
    contact_name?: string;
    payment_terms?: string;
    tax_id?: string;
    notes?: string;
    join_date?: string;
  }>(),
  fulfillmentType: text('fulfillment_type').notNull().default('dropship'),
  websiteUrl: text('website_url'),
  logoUrl: text('logo_url'),

  // Affiliate program configuration (optional fields)
  affiliateId: text('affiliate_id'),
  affiliateUrlTemplate: text('affiliate_url_template'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Index for querying suppliers with affiliate programs
  affiliateIdIdx: index('idx_suppliers_affiliate_id').on(table.affiliateId),
}));

