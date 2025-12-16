import { pgTable, text, uuid, timestamp, jsonb } from 'drizzle-orm/pg-core';

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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

