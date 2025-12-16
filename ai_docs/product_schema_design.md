# Product Schema Design & Transaction Flow

This document outlines the comprehensive data schema for Emergency Planner, supporting a hybrid business model of **Affiliate Links** (Type 1) and **Drop-Ship** (Type 2) products. It also details the integration with Stripe for payments and the "Split Cart" functionality.

## 1. Business Model & Transaction Flows

### 1.1 The Hybrid "Split Cart" Model
Our system supports bundles that contain a mix of:
1.  **Affiliate Items**: Products the user buys directly from a third party (e.g., Amazon). We provide the link; the user completes the purchase externally.
2.  **Drop-Ship Items**: Products the user buys from US. We charge the customer via Stripe, then manually (or automatically) place the order with the supplier who ships to the customer.

**User Experience:**
*   User adds a "Nuclear Fallout Bundle" to their cart.
*   The bundle contains 5 Amazon items and 3 Drop-ship items.
*   **Checkout Phase 1 (Our Store):** The user pays for the 3 Drop-ship items using Stripe. An Order is created in our system.
*   **Checkout Phase 2 (Affiliate):** The user is presented with a list of "Remaining Items" (Amazon items) with direct links to purchase them (or an "Add to Amazon Cart" button if supported).

### 1.2 Stripe Integration
*   We act as the Merchant of Record for Drop-ship items.
*   **Security:** We **NEVER** store raw credit card numbers.
*   **Data Storage:**
    *   `stripe_customer_id` is stored in the `profiles` table to allow for saved cards/future purchases.
    *   `stripe_payment_intent_id` or `stripe_session_id` is stored in the `orders` table for transaction tracking.

---

## 2. Database Schema

### 2.1 Core Catalog Structure (Preserving Existing Hierarchy)

The system leverages the existing 3-tier hierarchy:
1.  **Categories** (`categories`): Hierarchical tree (e.g., "Water" -> "Water Filters").
2.  **Master Items** (`master_items`): Generic product concepts (e.g., "Portable Water Filter").
3.  **Specific Products** (`specific_products`): Actual buyable SKUs (e.g., "Sawyer Mini Water Filter - Blue").

#### `categories` (Existing)
Hierarchical tree structure.
*   `id` (UUID, PK)
*   `name` (Text)
*   `parent_id` (UUID, FK -> categories.id)
*   `slug` (Text)
*   `description` (Text)
*   `created_at` (Timestamptz)
*   *Indexes*: `parent_id` (B-Tree for traversal)

#### `master_items` (Existing - Modified)
Generic product concepts.
*   `id` (UUID, PK)
*   `category_id` (UUID, FK -> categories.id)
*   `name` (Text)
*   `description` (Text)
*   `embedding` (Vector): For AI matching.
*   `status` (Text): 'active' | 'pending_review'.
*   `created_at` (Timestamptz)
*   *Indexes*: `category_id` (B-Tree), `embedding` (IVFFlat for similarity search)

#### `specific_products` (Existing - Enhanced)
The buyable SKUs. **This replaces the proposed `products` table.**
*   `id` (UUID, PK)
*   `master_item_id` (UUID, FK -> master_items.id)
*   `supplier_id` (UUID, FK -> suppliers.id): **NEW**
*   `name` (Text): Full product name.
*   `description` (Text)
*   `price` (Numeric): Current selling price.
*   `sku` (Text): Internal or Vendor SKU.
*   `asin` (Text): Amazon Standard ID number (if applicable).
*   `image_url` (Text)
*   `product_url` (Text): Affiliate link or supplier product page.
*   `type` (Text): 'AFFILIATE' | 'DROP_SHIP'. **NEW** (Migrated from `product_offers` concept)
*   `is_active` (Boolean): Default true. **NEW**
*   `metadata` (JSONB): Flexible attributes (Weight, Dimensions, Expiration, etc.). **NEW**
    *   *Indexes*: `master_item_id` (B-Tree), `supplier_id` (B-Tree), `metadata` (GIN for attribute filtering)

#### `suppliers` (New)
Manages the vendors.
*   `id` (UUID, PK)
*   `name` (Text)
*   `contact_info` (JSONB)
*   `fulfillment_type` (Text)
*   `website_url` (Text)

### 2.2 Bundles & Recommendations

#### `bundles` (New)
*   `id` (UUID, PK)
*   `name` (Text)
*   `slug` (Text, Unique)
*   `total_estimated_price` (Numeric)
*   ...

#### `bundle_items` (New)
Links `bundles` to `specific_products`.
*   `id` (UUID, PK)
*   `bundle_id` (UUID, FK -> bundles.id)
*   `specific_product_id` (UUID, FK -> specific_products.id)
*   `quantity` (Integer)

### 2.3 Commerce & Fulfillment

#### `orders` (New)
Records purchases for Drop-ship items. Updated with detailed cost breakdown.
*   `id` (UUID, PK)
*   `user_id` (UUID, FK -> auth.users)
*   `stripe_session_id` (Text)
*   `subtotal_amount` (Numeric): Sum of item prices.
*   `shipping_cost` (Numeric): Calculated shipping fee.
*   `tax_amount` (Numeric): Sales tax.
*   `processing_fee` (Numeric): Stripe/Platform fees (optional pass-through).
*   `tariff_amount` (Numeric): Import duties if applicable.
*   `total_amount` (Numeric): Final charge to customer (Subtotal + Fees).
*   `currency` (Text): Default 'USD'.
*   `status` (Text)
*   `shipping_address` (JSONB)

#### `order_items` (New)
*   `id` (UUID, PK)
*   `order_id` (UUID, FK -> orders.id)
*   `specific_product_id` (UUID, FK -> specific_products.id)
*   `quantity` (Integer)
*   `unit_price` (Numeric)
*   `supplier_status` (Text)

---

## 3. Migration Strategy

1.  **Preserve**: `categories`, `master_items`, `specific_products`.
2.  **Alter**: 
    *   Add `supplier_id`, `type`, `price`, `product_url`, `metadata` to `specific_products`.
    *   Drop `product_offers` table (merge its data into `specific_products` or keep as historical if strict 1:many sellers needed, but simplified model suggests 1 main offer per specific product for now).
3.  **Create**: `suppliers`, `bundles`, `orders`, `shipments`.
