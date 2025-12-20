import { pgTable, text, uuid, timestamp, integer, decimal, jsonb, index, boolean } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { specificProducts } from './products';
import { bundles } from './bundles';
import { consultingBookings } from './consulting';

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    stripeSessionId: text('stripe_session_id'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    subtotalAmount: decimal('subtotal_amount', { precision: 10, scale: 2 }).notNull(),
    shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).default('0'),
    taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('usd'),
    orderType: text('order_type').notNull().default('product'),
    status: text('status').notNull().default('pending'),
    shippingAddress: jsonb('shipping_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_orders_user_id').on(table.userId),
    statusIdx: index('idx_orders_status').on(table.status),
    orderTypeIdx: index('idx_orders_order_type').on(table.orderType),
  })
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    specificProductId: uuid('specific_product_id')
      .references(() => specificProducts.id, { onDelete: 'restrict' }),
    consultingBookingId: uuid('consulting_booking_id')
      .references(() => consultingBookings.id, { onDelete: 'restrict' }),
    itemType: text('item_type').notNull().default('product'),
    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    supplierStatus: text('supplier_status').default('pending'),
    bundleId: uuid('bundle_id').references(() => bundles.id, { onDelete: 'set null' }),
    isOriginalProduct: boolean('is_original_product').default(true),
    originalSpecificProductId: uuid('original_specific_product_id').references(
      () => specificProducts.id,
      { onDelete: 'set null' }
    ),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index('idx_order_items_order_id').on(table.orderId),
    bundleIdIdx: index('idx_order_items_bundle_id').on(table.bundleId),
    isOriginalProductIdx: index('idx_order_items_is_original_product').on(
      table.isOriginalProduct
    ),
    consultingBookingIdIdx: index('idx_order_items_consulting_booking_id').on(table.consultingBookingId),
    itemTypeIdx: index('idx_order_items_item_type').on(table.itemType),
  })
);

export const shipments = pgTable(
  'shipments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    carrier: text('carrier'),
    trackingNumber: text('tracking_number'),
    trackingUrl: text('tracking_url'),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    estimatedDelivery: timestamp('estimated_delivery', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index('idx_shipments_order_id').on(table.orderId),
  })
);

export const shipmentItems = pgTable('shipment_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  shipmentId: uuid('shipment_id')
    .notNull()
    .references(() => shipments.id, { onDelete: 'cascade' }),
  orderItemId: uuid('order_item_id')
    .notNull()
    .references(() => orderItems.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
});

