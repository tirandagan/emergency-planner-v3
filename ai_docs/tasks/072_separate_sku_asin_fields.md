# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Separate SKU and ASIN Fields in Product Form and Variations

### Goal Statement
**Goal:** Separate the combined "SKU / ASIN" field in the product edit form into two distinct fields (SKU and ASIN), add ASIN as a variation option, and ensure affiliate link generation correctly uses the appropriate field based on the supplier's affiliate URL template. This improves data accuracy and ensures proper affiliate link generation for products with variations.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The current product edit form combines SKU and ASIN into a single input field, but the database schema (`specific_products` table) has separate columns for each. This creates data ambiguity where ASINs might be stored in the SKU field or vice versa. Additionally, the variations system doesn't support ASIN as a variation attribute, which is needed for products that have different ASINs per variant (e.g., different colors/sizes of Amazon products).

### Solution Options Analysis

#### Option 1: Separate Fields with Smart Field Detection
**Approach:** Add separate SKU and ASIN input fields in the form, detect which field the affiliate URL template uses via template parsing, and automatically populate variations based on active toggles.

**Pros:**
- ✅ Clearest user experience - users see exactly what data is being captured
- ✅ Aligns with existing database schema (no migration needed)
- ✅ Leverages existing `parseTemplateFields()` function to determine which field is needed
- ✅ Prevents data corruption where ASIN might accidentally go into SKU field
- ✅ Makes affiliate link generation more explicit and debuggable

**Cons:**
- ❌ Slightly more complex UI with two fields instead of one
- ❌ Requires updating existing products that have ASIN in SKU field (data cleanup)
- ❌ Need to handle backward compatibility for products created before this change

**Implementation Complexity:** Medium - Form changes straightforward, variation system requires careful integration

**Risk Level:** Low - No database schema changes, only UI and logic updates

#### Option 2: Keep Combined Field with Auto-Detection
**Approach:** Keep the single "SKU / ASIN" field but add smart detection logic to determine if the value is an ASIN (10-char alphanumeric) vs SKU, and store in correct field automatically.

**Pros:**
- ✅ Simpler UI - single field maintains current user experience
- ✅ No training required for users already familiar with current form
- ✅ Automatic classification reduces user errors

**Cons:**
- ❌ Hidden logic may confuse users about which field is being populated
- ❌ SKUs that happen to be 10 characters could be misclassified as ASINs
- ❌ Doesn't clearly communicate to users which value is needed for affiliate links
- ❌ Makes debugging affiliate link issues harder (which field was used?)
- ❌ Still requires variation system changes for ASIN support

**Implementation Complexity:** Medium - Detection logic adds complexity, variation system still needs work

**Risk Level:** Medium - Risk of misclassification for edge cases

#### Option 3: Separate Fields with Field-Specific Variation Toggles
**Approach:** Separate SKU and ASIN fields, add individual toggles in variation config for each field, and dynamically show/hide variation columns based on which fields are variable.

**Pros:**
- ✅ Most flexible system - supports products with variable SKUs only, ASINs only, or both
- ✅ Clearest data model - explicit control over what varies
- ✅ Makes affiliate link generation logic transparent
- ✅ Prevents accidental variation data entry for non-varying fields

**Cons:**
- ❌ Most complex UI changes - requires additional variation toggles
- ❌ Higher learning curve for users configuring variations
- ❌ More code changes across variation modal and table components

**Implementation Complexity:** High - Multiple components need updates, more complex state management

**Risk Level:** Medium - More moving parts means more potential for bugs

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Separate Fields with Smart Field Detection

**Why this is the best choice:**
1. **Data Integrity** - Aligns with existing database schema and prevents field confusion
2. **User Clarity** - Users explicitly see which field they're filling (SKU vs ASIN)
3. **Affiliate Link Reliability** - Template parsing makes it clear which field is used for URL generation
4. **Moderate Complexity** - Achieves the goal without over-engineering (Option 3) or hiding logic (Option 2)
5. **Debugging Benefits** - Errors in affiliate link generation will be easier to trace

**Key Decision Factors:**
- **Performance Impact:** Minimal - only UI changes, no database schema modifications
- **User Experience:** Improved clarity outweighs slight increase in form complexity
- **Maintainability:** Explicit separation is easier to maintain and debug long-term
- **Scalability:** Sets foundation for future expansion (e.g., other product identifiers like UPC)
- **Security:** No security implications, purely structural change

**Alternative Consideration:**
Option 2 would be acceptable if users strongly prefer a single field, but the risk of misclassification and reduced transparency make it less ideal. Option 3 is over-engineered for the current requirement and can be implemented later if needed.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended solution (Option 1), or would you prefer a different approach?

**Questions for you to consider:**
- Are you comfortable with users seeing two separate fields (SKU and ASIN) instead of one combined field?
- Do you have existing products where ASINs are stored in the SKU field that would need data cleanup?
- Do you want ASIN to be shown in the variations table for all products, or only when the variation toggle is enabled?

**Next Steps:**
Once you approve the strategic direction, I'll update the implementation plan and present you with next step options.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15+, React 19
- **Language:** TypeScript 5+ with strict mode
- **Database & ORM:** PostgreSQL via Drizzle ORM
- **UI & Styling:** Shadcn/ui components with Tailwind CSS v4
- **Key Architectural Patterns:** Next.js App Router, Server Components, Server Actions for mutations
- **Relevant Existing Components:**
  - `ProductEditDialog.tsx` - Main product form
  - `VariationsModal.tsx` - Variation attribute configuration
  - `VariationsTableModal.tsx` - Variation values grid (referenced but not yet read)
  - `ProductRow.tsx` - Product display component
  - `affiliate-urls.ts` - Template-based affiliate URL builder

### Current State
**Database Schema** ([products.ts:44-45](src/db/schema/products.ts#L44-L45)):
```typescript
sku: text('sku'),
asin: text('asin').unique(),
```
The schema already has separate columns for SKU and ASIN, with ASIN having a unique constraint.

**Product Edit Form** ([ProductEditDialog.tsx:1179-1191](src/app/(protected)/admin/products/components/ProductEditDialog.tsx#L1179-L1191)):
```typescript
<InputGroup label="SKU / ASIN">
    <TextInput
        ref={asinInputRef}
        name="asin"
        value={formState.asin || formState.sku || ''}
        onChange={e => handleAsinChange(e.target.value)}
        onBlur={handleAsinBlur}
        placeholder="e.g. B005EHPVQW"
        maxLength={10}
    />
</InputGroup>
```
Currently combines both fields into a single input, with the value coming from either `asin` or `sku` and saving to the `asin` field via the `name` attribute. The `handleAsinChange()` function performs ASIN validation and auto-fetch logic.

**Product Display** ([ProductRow.tsx:274](src/app/(protected)/admin/products/components/ProductRow.tsx#L274)):
```typescript
<div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2 mt-0.5">
    {product.sku || product.asin || 'No ID'}
</div>
```
Shows whichever field is populated, with SKU taking priority.

**Variations System** ([VariationsModal.tsx:14-19](src/app/(protected)/admin/products/components/VariationsModal.tsx#L14-L19)):
```typescript
toggles: {
    price: boolean;
    sku: boolean;
    quantity: boolean;
    processing: boolean;
};
```
Currently has toggle for SKU variations but no ASIN toggle.

**Affiliate URL System** ([affiliate-urls.ts:32-38](src/lib/affiliate-urls.ts#L32-L38)):
```typescript
const ALLOWED_PRODUCT_FIELDS = new Set([
  'sku',
  'name',
  'price',
  'product_url',
  'asin',
]);
```
Already supports both `sku` and `asin` as separate template fields. The `resolveFieldValue()` function correctly checks variations first, then product fields.

### Existing Context Providers Analysis
This task does not require context provider analysis as it's a pure form/UI change with no server-side data fetching requirements. Form state is managed locally within the `ProductEditDialog` component.

## 4. Context & Problem Definition

### Problem Statement
**Current Issues:**
1. **Field Confusion:** Users see a single "SKU / ASIN" field but the database stores these separately, causing confusion about which value is being captured
2. **Data Integrity:** ASIN values may be stored in the SKU field or vice versa, making data unreliable
3. **Affiliate Link Errors:** The affiliate URL system expects specific fields (`{sku}` or `{asin}` in templates) but the form doesn't clearly indicate which field is being populated
4. **Missing Variation Support:** Products with multiple ASINs (e.g., different colors on Amazon) cannot track ASIN per variation
5. **Display Ambiguity:** The product row shows whichever field exists, but users can't tell if it's showing SKU or ASIN

### Success Criteria
- [x] Product edit form has separate, clearly labeled "SKU" and "ASIN" input fields
- [x] Variation modal includes "ASINs vary" toggle alongside existing "SKUs vary" toggle
- [x] Variation table displays ASIN column when the ASIN toggle is enabled
- [x] Affiliate link generation correctly uses ASIN field when template contains `{asin}` placeholder
- [x] Product row display shows both SKU and ASIN when available (not just one)
- [x] Form validation prevents saving when required field is missing based on affiliate template

---

## 5. Development Mode Context

### Development Mode Context
- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes
- **Data loss acceptable** - existing data can be wiped/migrated aggressively
- **Users are developers/testers** - not production users requiring careful migration
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** - delete/recreate components as needed

---

## 6. Technical Requirements

### Functional Requirements
- User can enter SKU in dedicated SKU field and ASIN in dedicated ASIN field
- Form displays which field is required based on the selected supplier's affiliate URL template
- When configuring variations, user can toggle "ASINs vary" to indicate ASIN changes per variant
- Variation table shows ASIN column when "ASINs vary" is enabled, allowing unique ASIN per combination
- Affiliate link builder uses variation-specific ASIN when available, falls back to product ASIN
- Product row displays both SKU and ASIN (when present) instead of showing only one
- Form validation prevents submission if required affiliate template field is missing

### Non-Functional Requirements
- **Performance:** No performance impact expected - form changes only
- **Security:** No security implications - pure UI/structural change
- **Usability:**
  - Separate fields improve data clarity
  - Field labels clearly indicate which value is expected
  - Validation messages specify which field is missing for affiliate links
- **Responsive Design:** Fields must stack properly on mobile (existing pattern should handle this)
- **Theme Support:** Follow existing form styling patterns (already supports light/dark mode)
- **Compatibility:** No browser compatibility concerns beyond existing requirements

### Technical Constraints
- Must maintain compatibility with existing affiliate URL template system (`affiliate-urls.ts`)
- Cannot modify database schema (fields already exist correctly)
- Must preserve existing variation data structure format
- Form must continue to support Amazon auto-fetch workflow via ASIN field

---

## 7. Data & Database Changes

### Database Schema Changes
**No database schema changes required.** The `specific_products` table already has the correct structure:
```sql
-- Existing schema (no changes needed)
CREATE TABLE specific_products (
  ...
  sku TEXT,
  asin TEXT UNIQUE,
  ...
);
```

### Data Model Updates
**TypeScript Types - No changes needed to core Product type:**
```typescript
// src/lib/products-types.ts (existing - no changes)
interface Product {
  sku: string | null;
  asin: string | null;
  // ... other fields
}
```

**Variation Config Type Update** ([VariationsModal.tsx:14-19](src/app/(protected)/admin/products/components/VariationsModal.tsx#L14-L19)):
```typescript
// BEFORE
export interface VariationConfig {
    attributes: VariationAttribute[];
    toggles: {
        price: boolean;
        sku: boolean;
        quantity: boolean;
        processing: boolean;
    };
}

// AFTER
export interface VariationConfig {
    attributes: VariationAttribute[];
    toggles: {
        price: boolean;
        sku: boolean;
        asin: boolean;        // ✅ NEW
        quantity: boolean;
        processing: boolean;
    };
}
```

### Data Migration Plan
**MANDATORY Data Migration** (required before UI changes):
- [ ] **Task 1:** Query Amazon products where `asin` is NULL or empty AND `sku` is NOT NULL
- [ ] **Task 2:** For each matching product, move `sku` value to `asin` field, set `sku` to NULL
- [ ] **Task 3:** Validate migration - ensure all Amazon products have ASINs populated
- [ ] **Task 4:** Verify affiliate links still work after migration

**Migration SQL:**
```sql
-- Move SKU to ASIN for Amazon products with blank ASIN
UPDATE specific_products sp
SET
  asin = sp.sku,
  sku = NULL
FROM suppliers s
WHERE sp.supplier_id = s.id
  AND s.name = 'Amazon'
  AND (sp.asin IS NULL OR sp.asin = '')
  AND sp.sku IS NOT NULL
  AND sp.sku != '';
```

### 🚨 MANDATORY: Down Migration Safety Protocol
**Not applicable - no database migrations required for this task.**

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**No API or server-side changes required.** This task only involves client-side form updates.

### Server Actions
**No new server actions needed.** Existing `updateProduct()` and `createProduct()` actions already handle both `sku` and `asin` fields separately via FormData.

### Database Queries
**No query changes needed.** Existing queries already select both `sku` and `asin` fields.

### API Routes
**Not applicable** - no API routes involved in this task.

### External Integrations
**No changes to external integrations.** The Amazon auto-fetch workflow (triggered by ASIN field) will continue to work with the dedicated ASIN input field.

---

## 9. Frontend Changes

### New Components
**No new components required.** All changes are modifications to existing components.

### Page Updates
**No page-level changes** - all modifications are within the `ProductEditDialog` component.

### State Management
**Local Form State Updates** ([ProductEditDialog.tsx:57](src/app/(protected)/admin/products/components/ProductEditDialog.tsx#L57)):
```typescript
// No changes to formState structure - it already supports both fields
const [formState, setFormState] = useState<Partial<Product>>({});
// formState.sku and formState.asin are already separate
```

**Variation State Updates** ([VariationsModal.tsx:52-57](src/app/(protected)/admin/products/components/VariationsModal.tsx#L52-L57)):
```typescript
// BEFORE
const [toggles, setToggles] = useState({
    price: false,
    sku: false,
    quantity: false,
    processing: false
});

// AFTER
const [toggles, setToggles] = useState({
    price: false,
    sku: false,
    asin: false,        // ✅ NEW
    quantity: boolean,
    processing: false
});
```

### 🚨 CRITICAL: Context Usage Strategy
**Not applicable** - this component uses local form state, not context providers.

---

## 10. Code Changes Overview

### 🚨 MANDATORY: Always Show High-Level Code Changes Before Implementation

#### 📂 **Current Implementation (Before)**

**Product Edit Form - Combined Field** ([ProductEditDialog.tsx:1179-1191](src/app/(protected)/admin/products/components/ProductEditDialog.tsx#L1179-L1191)):
```tsx
<InputGroup label="SKU / ASIN">
    <TextInput
        ref={asinInputRef}
        name="asin"
        value={formState.asin || formState.sku || ''}
        onChange={e => handleAsinChange(e.target.value)}
        onBlur={handleAsinBlur}
        placeholder="e.g. B005EHPVQW"
        maxLength={10}
    />
    {renderSuggestion('asin')}
    {renderSuggestion('sku')}
</InputGroup>
```

**Variation Modal - No ASIN Toggle** ([VariationsModal.tsx:327-342](src/app/(protected)/admin/products/components/VariationsModal.tsx#L327-L342)):
```tsx
<div className="space-y-3">
    {[
        { id: 'price', label: 'Prices vary' },
        { id: 'processing', label: 'Processing profiles vary' },
        { id: 'quantity', label: 'Quantities vary' },
        { id: 'sku', label: 'SKUs vary' }
        // ❌ Missing ASIN toggle
    ].map(toggle => (
        <div key={toggle.id} className="p-3 bg-muted/50 rounded-lg border border-border">
            <Switch
                isSelected={toggles[toggle.id as keyof typeof toggles]}
                onChange={(isSelected) => setToggles(prev => ({ ...prev, [toggle.id]: isSelected }))}
                className="text-base"
            >
                <span className="text-foreground">{toggle.label}</span>
            </Switch>
        </div>
    ))}
</div>
```

**Product Row - Shows One or the Other** ([ProductRow.tsx:273-275](src/app/(protected)/admin/products/components/ProductRow.tsx#L273-L275)):
```tsx
<div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2 mt-0.5">
    {product.sku || product.asin || 'No ID'}
</div>
```

#### 📂 **After Refactor**

**Product Edit Form - Separate Fields**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <InputGroup label="SKU" required={/* based on affiliate template */}>
        <TextInput
            name="sku"
            value={formState.sku || ''}
            onChange={e => setFormState({ ...formState, sku: e.target.value })}
            placeholder="e.g. PROD-12345"
        />
        {renderSuggestion('sku')}
    </InputGroup>

    <InputGroup label="ASIN" required={/* based on affiliate template */}>
        <TextInput
            ref={asinInputRef}
            name="asin"
            value={formState.asin || ''}
            onChange={e => handleAsinChange(e.target.value)}
            onBlur={handleAsinBlur}
            placeholder="e.g. B005EHPVQW"
            maxLength={10}
        />
        {renderSuggestion('asin')}
    </InputGroup>
</div>
```

**Variation Modal - ASIN Toggle Added**:
```tsx
<div className="space-y-3">
    {[
        { id: 'price', label: 'Prices vary' },
        { id: 'processing', label: 'Processing profiles vary' },
        { id: 'quantity', label: 'Quantities vary' },
        { id: 'sku', label: 'SKUs vary' },
        { id: 'asin', label: 'ASINs vary' }  // ✅ NEW
    ].map(toggle => (
        <div key={toggle.id} className="p-3 bg-muted/50 rounded-lg border border-border">
            <Switch
                isSelected={toggles[toggle.id as keyof typeof toggles]}
                onChange={(isSelected) => setToggles(prev => ({ ...prev, [toggle.id]: isSelected }))}
                className="text-base"
            >
                <span className="text-foreground">{toggle.label}</span>
            </Switch>
        </div>
    ))}
</div>
```

**Product Row - Shows Both**:
```tsx
<div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2 mt-0.5">
    {product.sku && <span>SKU: {product.sku}</span>}
    {product.sku && product.asin && <span className="text-border">•</span>}
    {product.asin && <span>ASIN: {product.asin}</span>}
    {!product.sku && !product.asin && 'No ID'}
</div>
```

#### 🎯 **Key Changes Summary**
- [ ] **Product Edit Form:** Split combined "SKU / ASIN" field into two separate labeled inputs
- [ ] **Variation Modal:** Add ASIN toggle to variation configuration (4 toggles → 5 toggles)
- [ ] **Variation Table:** Display ASIN column when `config.toggles.asin === true`
- [ ] **Product Row:** Display both SKU and ASIN when available (not just one)
- [ ] **Files Modified:**
  - `ProductEditDialog.tsx` (form inputs section)
  - `VariationsModal.tsx` (type definition + toggles list)
  - `VariationsTableModal.tsx` (column display logic - not yet read, will need to examine)
  - `ProductRow.tsx` (display logic)
- [ ] **Impact:** Improves data clarity, enables ASIN-based product variations, ensures correct affiliate link generation

---

## 11. Implementation Plan

### Phase 0: Data Migration for Amazon Products
**Goal:** Move SKU values to ASIN field for Amazon products with blank ASINs

- [ ] **Task 0.1:** Query Products Needing Migration
  - Files: Database query via `psql` or SQL script
  - Details:
    - Find Amazon products where `asin` is NULL/empty but `sku` is populated
    - Count affected products to verify migration scope
    - Query: `SELECT COUNT(*) FROM specific_products sp JOIN suppliers s ON sp.supplier_id = s.id WHERE s.name = 'Amazon' AND (sp.asin IS NULL OR sp.asin = '') AND sp.sku IS NOT NULL AND sp.sku != '';`

- [ ] **Task 0.2:** Execute Migration SQL
  - Files: Database update via `psql` or migration script
  - Details:
    - Run UPDATE statement to move `sku` → `asin` for Amazon products
    - Set `sku` to NULL after copying to prevent duplicate data
    - SQL provided in "Data Migration Plan" section above

- [ ] **Task 0.3:** Validate Migration Results
  - Files: Database query via `psql`
  - Details:
    - Verify all Amazon products now have `asin` populated
    - Check that no Amazon products lost their identifier
    - Query: `SELECT id, name, sku, asin FROM specific_products sp JOIN suppliers s ON sp.supplier_id = s.id WHERE s.name = 'Amazon' ORDER BY created_at DESC LIMIT 20;`

- [ ] **Task 0.4:** Test Affiliate Link Generation
  - Files: Manual testing via product admin UI
  - Details:
    - Open a migrated Amazon product in the UI
    - Verify affiliate link button still works
    - Confirm URL contains correct ASIN value

### Phase 1: Update Form to Separate SKU and ASIN Fields
**Goal:** Replace the combined "SKU / ASIN" field with two distinct, labeled input fields

- [ ] **Task 1.1:** Modify Product Edit Form Input Fields
  - Files: `src/app/(protected)/admin/products/components/ProductEditDialog.tsx`
  - Details:
    - Replace lines 1179-1191 (current combined field)
    - Add two separate `<InputGroup>` components: one for SKU, one for ASIN
    - Update SKU field: `name="sku"`, `value={formState.sku}`, placeholder "e.g. PROD-12345"
    - Keep ASIN field: `name="asin"`, `ref={asinInputRef}`, existing validation logic
    - Both fields should render their respective suggestions via `{renderSuggestion()}`
    - Use grid layout: `grid grid-cols-1 md:grid-cols-2 gap-4` for responsive stacking

- [ ] **Task 1.2:** Update SKU Change Handler
  - Files: `src/app/(protected)/admin/products/components/ProductEditDialog.tsx`
  - Details:
    - Create new `handleSkuChange(newSku: string)` function for SKU field
    - Simple state update: `setFormState({ ...formState, sku: newSku })`
    - No auto-fetch logic needed (only ASIN triggers Amazon auto-fetch)

- [ ] **Task 1.3:** Update Form Initialization
  - Files: `src/app/(protected)/admin/products/components/ProductEditDialog.tsx`
  - Details:
    - Review `useEffect` at lines 106-154 (form initialization)
    - Ensure `formState.sku` and `formState.asin` are initialized separately from `product` data
    - No changes needed if already using `{ ...product }` spread (should preserve both fields)

- [ ] **Task 1.4:** Update Product Row Display
  - Files: `src/app/(protected)/admin/products/components/ProductRow.tsx`
  - Details:
    - Replace line 274 (current display logic)
    - Show both fields: `{product.sku && <span>SKU: {product.sku}</span>}`
    - Add separator when both exist: `{product.sku && product.asin && <span>•</span>}`
    - Show ASIN: `{product.asin && <span>ASIN: {product.asin}</span>}`
    - Fallback: `{!product.sku && !product.asin && 'No ID'}`

### Phase 2: Add ASIN to Variations System
**Goal:** Enable ASIN as a variation attribute alongside existing SKU variation support

- [ ] **Task 2.1:** Update Variation Config Type Definition
  - Files: `src/app/(protected)/admin/products/components/VariationsModal.tsx`
  - Details:
    - Update `VariationConfig` interface at lines 12-20
    - Add `asin: boolean;` to the `toggles` object (after `sku`, before `quantity`)
    - This change will propagate to all components using this type

- [ ] **Task 2.2:** Update Variation Modal State Initialization
  - Files: `src/app/(protected)/admin/products/components/VariationsModal.tsx`
  - Details:
    - Update state initialization at lines 52-57
    - Add `asin: false` to the `toggles` object
    - Update `useEffect` at lines 65-77 to include `asin: false` in default initialization
    - Ensure `initialConfig.toggles` check includes asin: `initialConfig.toggles.asin ?? false`

- [ ] **Task 2.3:** Add ASIN Toggle to Variation Modal UI
  - Files: `src/app/(protected)/admin/products/components/VariationsModal.tsx`
  - Details:
    - Update toggles array at lines 327-332
    - Add `{ id: 'asin', label: 'ASINs vary' }` after the SKU toggle
    - No other UI changes needed - existing map loop will render the new toggle

- [ ] **Task 2.4:** Read and Analyze Variation Table Component
  - Files: `src/app/(protected)/admin/products/components/VariationsTableModal.tsx`
  - Details:
    - Read the file to understand current column rendering logic
    - Identify where SKU column is conditionally rendered based on `config.toggles.sku`
    - Prepare for Task 2.5 implementation

- [ ] **Task 2.5:** Add ASIN Column to Variation Table
  - Files: `src/app/(protected)/admin/products/components/VariationsTableModal.tsx`
  - Details:
    - Add ASIN column header when `config.toggles.asin === true`
    - Add ASIN input cell for each variation row (similar to SKU implementation)
    - Input should be: `maxLength={10}`, alphanumeric validation, uppercase transformation
    - Store ASIN value in variation data structure: `values[combination].asin`
    - Display format: `ASIN: {value}` (similar to SKU display pattern)

- [ ] **Task 2.6:** Update Affiliate URL Resolution for Variations
  - Files: `src/lib/affiliate-urls.ts`
  - Details:
    - Review `resolveFieldValue()` function at lines 188-230
    - Verify ASIN field is already supported in variation data (should be via existing logic)
    - Add explicit check for `asin` in variation values if not already present
    - Test that variation ASIN takes priority over product ASIN (Priority 1 in resolution)

### Phase 3: Update Variation Toggle Display Order
**Goal:** Ensure consistent toggle ordering across variation modal

- [ ] **Task 3.1:** Verify Toggle Order Consistency
  - Files: `src/app/(protected)/admin/products/components/VariationsModal.tsx`
  - Details:
    - Confirm toggle order matches: Price, Processing, Quantity, SKU, ASIN
    - Update toggle array at lines 327-332 to match this order if different
    - Ensure initialization in `useEffect` follows same order for consistency

### Phase 4: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 4.1:** Code Quality Verification
  - Files: All modified files
  - Details: Run linting and static analysis ONLY - NEVER run dev server, build, or start commands
    - `npm run lint` on modified files
    - Check for TypeScript errors via editor/IDE (no `tsc` command needed)
    - Verify no console errors or warnings introduced

- [ ] **Task 4.2:** Static Logic Review
  - Files: Modified business logic files
  - Details: Read code to verify logic syntax, edge case handling, fallback patterns
    - Verify `handleSkuChange()` correctly updates `formState.sku`
    - Confirm `handleAsinChange()` still works with separate field
    - Check variation toggle initialization includes `asin: false`
    - Verify product row display handles all cases (both, one, neither)

- [ ] **Task 4.3:** Type Safety Verification
  - Files: `VariationsModal.tsx`, components using `VariationConfig` type
  - Details:
    - Verify `VariationConfig` type is correctly updated with `asin` toggle
    - Check that all usages of `config.toggles` account for new `asin` property
    - Ensure no type errors in variation table column rendering logic

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 4, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 5: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 5.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval

- [ ] **Task 5.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 6: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality that requires browser interaction

- [ ] **Task 6.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide comprehensive results of all AI-verifiable testing

- [ ] **Task 6.2:** Request User UI Testing
  - Files: Specific browser testing checklist for user
  - Details:
    **Form Testing:**
    - [ ] Open product edit dialog, verify two separate fields: "SKU" and "ASIN"
    - [ ] Enter SKU value, verify it saves correctly and displays in product row
    - [ ] Enter ASIN value, verify it triggers Amazon auto-fetch modal (if supplier is Amazon)
    - [ ] Test with both fields populated, verify product row shows both with separator
    - [ ] Test with only SKU, verify product row shows only SKU
    - [ ] Test with only ASIN, verify product row shows only ASIN

    **Variation Testing:**
    - [ ] Open variation modal, verify "ASINs vary" toggle appears after "SKUs vary"
    - [ ] Enable "ASINs vary" toggle, open variation table
    - [ ] Verify ASIN column appears in variation table
    - [ ] Enter different ASIN per variation, save, verify data persists
    - [ ] Create affiliate link for variation with unique ASIN, verify correct ASIN used in URL

    **Edge Cases:**
    - [ ] Test product with no SKU or ASIN, verify "No ID" displays
    - [ ] Test variation with ASIN but product has different ASIN, verify variation ASIN takes priority

- [ ] **Task 6.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete browser testing and confirm results

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date (fallback to web search if time tool unavailable)
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date (not assumed date)
- [ ] **Add brief completion notes** (file paths, key changes, etc.)
- [ ] **This serves multiple purposes:**
  - [ ] **Forces verification** - You must confirm you actually did what you said
  - [ ] **Provides user visibility** - Clear progress tracking throughout implementation
  - [ ] **Prevents skipped steps** - Systematic approach ensures nothing is missed
  - [ ] **Creates audit trail** - Documentation of what was actually completed
  - [ ] **Enables better debugging** - If issues arise, easy to see what was changed

### Example Task Completion Format
```
### Phase 1: Form Field Separation
**Goal:** Replace combined SKU/ASIN field with two distinct inputs

- [x] **Task 1.1:** Modify Product Edit Form Input Fields ✓ 2025-12-23
  - Files: `ProductEditDialog.tsx` (lines 1179-1191 replaced with grid layout) ✓
  - Details: Separate SKU and ASIN fields created, responsive grid applied ✓
- [x] **Task 1.2:** Update SKU Change Handler ✓ 2025-12-23
  - Files: `ProductEditDialog.tsx` (new `handleSkuChange` function added after line 627) ✓
  - Details: Simple state update handler implemented ✓
```

---

## 13. File Structure & Organization

### New Files to Create
**No new files required** - all changes are modifications to existing files.

### Files to Modify
- [ ] **`src/app/(protected)/admin/products/components/ProductEditDialog.tsx`** - Separate SKU/ASIN input fields, add SKU handler
- [ ] **`src/app/(protected)/admin/products/components/VariationsModal.tsx`** - Add ASIN toggle to variation config
- [ ] **`src/app/(protected)/admin/products/components/VariationsTableModal.tsx`** - Add ASIN column to variation table
- [ ] **`src/app/(protected)/admin/products/components/ProductRow.tsx`** - Update display to show both SKU and ASIN

### Dependencies to Add
**No new dependencies required** - using existing components and utilities.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** User saves product with neither SKU nor ASIN populated
  - **Code Review Focus:** Check form validation in `ProductEditDialog.tsx` - should require at least one identifier
  - **Potential Fix:** Add validation to ensure either SKU or ASIN is provided before allowing save

- [ ] **Error Scenario 2:** Affiliate URL template requires `{asin}` but product has no ASIN
  - **Code Review Focus:** `affiliate-urls.ts` `resolveFieldValue()` and `buildAffiliateUrl()` functions
  - **Potential Fix:** Already handled - `MissingFieldError` is thrown, triggers `AffiliateErrorModal`

- [ ] **Error Scenario 3:** User enters non-alphanumeric characters in ASIN field
  - **Code Review Focus:** `ProductEditDialog.tsx` line 630 - `handleAsinChange()` sanitization
  - **Potential Fix:** Already handled - regex replace removes non-alphanumeric characters

- [ ] **Error Scenario 4:** Variation ASIN is not saved correctly in variation values
  - **Code Review Focus:** `VariationsTableModal.tsx` - input onChange handler and values state update
  - **Potential Fix:** Ensure variation ASIN input properly updates `values[combination].asin`

### Edge Cases to Consider
- [ ] **Edge Case 1:** Product has ASIN in SKU field (legacy data)
  - **Analysis Approach:** Query database for products where `sku` matches ASIN pattern (10-char alphanumeric)
  - **Recommendation:** Optional data cleanup script to migrate misplaced ASINs

- [ ] **Edge Case 2:** User disables "ASINs vary" toggle after entering variation ASINs
  - **Analysis Approach:** Check if `VariationsTableModal.tsx` removes ASIN data from `values` object
  - **Recommendation:** Keep ASIN data even when toggle disabled (user might re-enable later)

- [ ] **Edge Case 3:** Product has variations but only base ASIN (no per-variant ASINs)
  - **Analysis Approach:** Verify `resolveFieldValue()` correctly falls back to product ASIN when variation ASIN is missing
  - **Recommendation:** Already handled by priority system (variation → product → supplier)

- [ ] **Edge Case 4:** Both SKU and ASIN fields are empty after form submission
  - **Analysis Approach:** Check server action validation in `actions.ts`
  - **Recommendation:** Add validation to require at least one identifier field

### Security & Access Control Review
- [ ] **Admin Access Control:** Are admin-only features properly restricted to admin users?
  - **Check:** Route protection in middleware, server action authorization
  - **Status:** ✅ Existing admin route protection applies - no new security concerns

- [ ] **Form Input Validation:** Are user inputs validated before processing?
  - **Check:** Client-side validation, server-side validation in server actions
  - **Status:** ✅ ASIN field already has sanitization (alphanumeric only), SKU needs basic validation

- [ ] **Data Integrity:** Can users corrupt data through malformed inputs?
  - **Check:** Database constraints, type validation, field length limits
  - **Status:** ✅ ASIN has unique constraint, both fields are nullable, maxLength enforced on ASIN

### AI Agent Analysis Approach
**Focus:** Review existing code to identify potential failure points and security gaps. When issues are found, provide specific recommendations with file paths and code examples. This is code analysis and gap identification - not writing tests or test procedures.

**Priority Order:**
1. **Critical:** Data integrity (ensuring SKU/ASIN are properly stored and displayed)
2. **Important:** Variation system integration (ASIN toggle, column display, data persistence)
3. **Nice-to-have:** Legacy data migration for misplaced ASINs

---

## 15. Deployment & Configuration

### Environment Variables
**No environment variable changes required** - this is a pure UI/frontend change.

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
🎯 **STANDARD OPERATING PROCEDURE:**
When a user requests any new feature, improvement, or significant change, your **DEFAULT BEHAVIOR** should be:

1. **EVALUATE STRATEGIC NEED** - Determine if multiple solutions exist or if it's straightforward
2. **STRATEGIC ANALYSIS** (if needed) - Present solution options with pros/cons and get user direction
3. **CREATE A TASK DOCUMENT** in `ai_docs/` using this template
4. **GET USER APPROVAL** of the task document
5. **IMPLEMENT THE FEATURE** only after approval

**DO NOT:** Present implementation plans in chat without creating a proper task document first.
**DO:** Always create comprehensive task documentation that can be referenced later.
**DO:** Present strategic options when multiple viable approaches exist.

### Communication Preferences
- [ ] Ask for clarification if requirements are unclear
- [ ] Provide regular progress updates during implementation
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **EVALUATE STRATEGIC NEED FIRST (Required)**
   - [x] **Assess complexity** - Is this a straightforward change or are there multiple viable approaches?
   - [x] **Review the criteria** in "Strategic Analysis & Solution Options" section
   - [x] **Decision point**: Skip to step 3 if straightforward, proceed to step 2 if strategic analysis needed

2. **STRATEGIC ANALYSIS SECOND (If needed)**
   - [x] **Present solution options** with pros/cons analysis for each approach
   - [x] **Include implementation complexity, time estimates, and risk levels** for each option
   - [x] **Provide clear recommendation** with rationale
   - [x] **Wait for user decision** on preferred approach before proceeding
   - [x] **Document approved strategy** for inclusion in task document

3. **CREATE TASK DOCUMENT THIRD (Required)**
   - [x] **Create a new task document** in the `ai_docs/tasks/` directory using this template
   - [x] **Fill out all sections** with specific details for the requested feature
   - [x] **Include strategic analysis** (if conducted) in the appropriate section
   - [x] **🔢 FIND LATEST TASK NUMBER**: Use `list_dir` to examine ai_docs/tasks/ directory and find the highest numbered task file (e.g., if highest is 071, use 072)
   - [x] **Name the file** using the pattern `XXX_feature_name.md` (where XXX is the next incremental number)
   - [x] **🚨 MANDATORY: POPULATE CODE CHANGES OVERVIEW**: Always read existing files and show before/after code snippets in section 10
   - [x] **Present a summary** of the task document to the user for review

4. **PRESENT IMPLEMENTATION OPTIONS (Required)**
   - [ ] **After incorporating user feedback**, present these 3 exact options:

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

   **C) Provide More Feedback**
   Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

   - [ ] **Wait for explicit user choice** (A, B, or C) - never assume or default
   - [ ] **If A chosen**: Provide detailed code snippets showing exact changes planned
   - [ ] **If B chosen**: Begin phase-by-phase implementation immediately
   - [ ] **If C chosen**: Address feedback and re-present options

5. **IMPLEMENT PHASE-BY-PHASE (Only after Option B approval)**

   **MANDATORY PHASE WORKFLOW:**

   For each phase, follow this exact pattern:

   a. **Execute Phase Completely** - Complete all tasks in current phase
   b. **Update Task Document** - Mark all completed tasks as [x] with timestamps
   c. **Provide Specific Phase Recap** using this format:

   ```
   ✅ **Phase [X] Complete - [Phase Name]**
   - Modified [X] files with [Y] total line changes
   - Key changes: [specific file paths and what was modified]
   - Files updated:
     • file1.tsx (+15 lines): [brief description of changes]
     • file2.tsx (-3 lines, +8 lines): [brief description of changes]
   - Commands executed: [list any commands run]
   - Linting status: ✅ All files pass / ❌ [specific issues found]

   **🔄 Next: Phase [X+1] - [Phase Name]**
   - Will modify: [specific files]
   - Changes planned: [brief description]
   - Estimated scope: [number of files/changes expected]

   **Say "proceed" to continue to Phase [X+1]**
   ```

   d. **Wait for "proceed"** before starting next phase
   e. **Repeat for each phase** until all implementation complete
   f. **🚨 CRITICAL:** After final implementation phase, you MUST proceed to Phase 5 (Comprehensive Code Review) before any user testing

   **🚨 PHASE-SPECIFIC REQUIREMENTS:**
   - [ ] **Real-time task completion tracking** - Update task document immediately after each subtask
   - [ ] **Mark checkboxes as [x]** with completion timestamps
   - [ ] **Add specific completion notes** (file paths, line counts, key changes)
   - [ ] **Run linting on each modified file** during the phase (static analysis only - no dev server/build commands)
   - [ ] **🚨 MANDATORY: For ANY database changes, create down migration file BEFORE running `npm run db:migrate`**
     - [ ] Follow `drizzle_down_migration.md` template process
     - [ ] Create `drizzle/migrations/[timestamp]/down.sql` file
     - [ ] Verify all operations use `IF EXISTS` and include warnings
     - [ ] Only then run `npm run db:migrate`
   - [ ] **For any new page route, create `loading.tsx` and `error.tsx` files alongside `page.tsx`**
   - [ ] **Always create components in `components/[feature]/` directories**
   - [ ] **🚨 MANDATORY WORKFLOW SEQUENCE:** After implementation phases, follow this exact order:
     - [ ] **Phase 4 Complete** → Present "Implementation Complete!" message (section 16, step 7)
     - [ ] **Wait for user approval** → Execute comprehensive code review (section 16, step 8)
     - [ ] **Code review complete** → ONLY THEN request user browser testing
     - [ ] **NEVER skip comprehensive code review** - Phase 4 basic validation ≠ comprehensive review
   - [ ] **NEVER plan manual browser testing as AI task** - always mark as "👤 USER TESTING" and wait for user confirmation

6. **VERIFY LIB FILE ARCHITECTURE (For any lib/ changes)**
   - **Not applicable** - no lib file changes in this task

7. **FINAL CODE REVIEW RECOMMENDATION (Mandatory after all phases)**
   - [ ] **Present this exact message** to user after all implementation complete:

   ```
   🎉 **Implementation Complete!**

   All phases have been implemented successfully. I've made changes to [X] files across [Y] phases.

   **📋 I recommend doing a thorough code review of all changes to ensure:**
   - No mistakes were introduced
   - All goals were achieved
   - Code follows project standards
   - Everything will work as expected

   **Would you like me to proceed with the comprehensive code review?**

   This review will include:
   - Verifying all changes match the intended goals
   - Running linting and type-checking on all modified files
   - Checking for any integration issues
   - Confirming all requirements were met
   ```

   - [ ] **Wait for user approval** of code review
   - [ ] **If approved**: Execute comprehensive code review process below

8. **COMPREHENSIVE CODE REVIEW PROCESS (If user approves)**
   - [ ] **Read all modified files** and verify changes match task requirements exactly
   - [ ] **Run linting and type-checking** on all modified files using appropriate commands
   - [ ] **Check for integration issues** between modified components
   - [ ] **Verify all success criteria** from task document are met
   - [ ] **Test critical workflows** affected by changes
   - [ ] **Provide detailed review summary** using this format:

   ```
   ✅ **Code Review Complete**

   **Files Reviewed:** [list all modified files with line counts]
   **Linting Status:** ✅ All files pass / ❌ [specific issues found]
   **Type Checking:** ✅ No type errors / ❌ [specific type issues]
   **Integration Check:** ✅ Components work together properly / ❌ [issues found]
   **Requirements Met:** ✅ All success criteria achieved / ❌ [missing requirements]

   **Summary:** [brief summary of what was accomplished and verified]
   **Confidence Level:** High/Medium/Low - [specific reasoning]
   **Recommendations:** [any follow-up suggestions or improvements]
   ```

### What Constitutes "Explicit User Approval"

#### For Strategic Analysis
**✅ STRATEGIC APPROVAL RESPONSES (Proceed to task document creation):**
- "Option 1 looks good"
- "Go with your recommendation"
- "I prefer Option 2"
- "Proceed with [specific option]"
- "That approach works"
- "Yes, use that strategy"

#### For Implementation Options (A/B/C Choice)
**✅ OPTION A RESPONSES (Show detailed code previews):**
- "A" or "Option A"
- "Preview the changes"
- "Show me the code changes"
- "Let me see what will be modified"
- "Walk me through the changes"

**✅ OPTION B RESPONSES (Start implementation immediately):**
- "B" or "Option B"
- "Proceed" or "Go ahead"
- "Approved" or "Start implementation"
- "Begin" or "Execute the plan"
- "Looks good, implement it"

**✅ OPTION C RESPONSES (Provide more feedback):**
- "C" or "Option C"
- "I have questions about..."
- "Can you modify..."
- "What about..." or "How will you handle..."
- "I'd like to change..."
- "Wait, let me think about..."

#### For Phase Continuation
**✅ PHASE CONTINUATION RESPONSES:**
- "proceed"
- "continue"
- "next phase"
- "go ahead"
- "looks good"

**❓ CLARIFICATION NEEDED (Do NOT continue to next phase):**
- Questions about the completed phase
- Requests for changes to completed work
- Concerns about the implementation
- No response or silence

#### For Final Code Review
**✅ CODE REVIEW APPROVAL:**
- "proceed"
- "yes, review the code"
- "go ahead with review"
- "approved"

🛑 **NEVER start coding without explicit A/B/C choice from user!**
🛑 **NEVER continue to next phase without "proceed" confirmation!**
🛑 **NEVER skip comprehensive code review after implementation phases!**
🛑 **NEVER run `npm run db:migrate` without first creating the down migration file using `drizzle_down_migration.md` template!**
🛑 **NEVER run application execution commands - user already has app running!**

### 🚨 CRITICAL: Command Execution Rules
**NEVER run application execution commands - the user already has their development environment running!**

**❌ FORBIDDEN COMMANDS (Will cause conflicts with running dev server):**
- `npm run dev` / `npm start` / `next dev` - User already running
- `npm run build` / `next build` - Expensive and unnecessary for validation
- Any command that starts/serves the application
- Any command that compiles/builds for production
- Any long-running processes or servers

**✅ ALLOWED COMMANDS (Safe static analysis only):**
- `npm run lint` - Static code analysis, safe to run
- `npm run type-check` / `tsc --noEmit` - Type checking only, no compilation
- Database commands (when explicitly needed): `npm run db:generate`, `npm run db:migrate`
- File reading/analysis tools

**🎯 VALIDATION STRATEGY:**
- Use linting for code quality issues
- Read files to verify logic and structure
- Check syntax and dependencies statically
- Let the user handle all application testing manually

### Code Quality Standards
- [ ] Follow TypeScript best practices
- [ ] Add proper error handling
- [ ] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
  - [ ] **❌ NEVER write change history**: "Fixed this", "Removed function", "Updated to use new API"
  - [ ] **❌ NEVER write migration artifacts**: "Moved from X", "Previously was Y"
  - [ ] **✅ ALWAYS explain business logic**: "Separate SKU and ASIN for clarity", "ASIN takes priority for Amazon products"
  - [ ] **✅ Write for future developers** - explain what/why the code does what it does, not what you changed
  - [ ] **Remove unused code completely** - don't leave comments explaining what was removed
- [ ] **🚨 MANDATORY: Use early returns to keep code clean and readable**
  - [ ] **Prioritize early returns** over nested if-else statements
  - [ ] **Validate inputs early** and return immediately for invalid cases
  - [ ] **Handle error conditions first** before proceeding with main logic
  - [ ] **Exit early for edge cases** to reduce nesting and improve readability
  - [ ] **Example pattern**: `if (invalid) return error; // main logic here`
- [ ] **🚨 MANDATORY: Use async/await instead of .then() chaining**
  - [ ] **Avoid Promise .then() chains** - use async/await for better readability
  - [ ] **Use try/catch blocks** for error handling instead of .catch() chaining
  - [ ] **Use Promise.all()** for concurrent operations instead of chaining multiple .then()
  - [ ] **Create separate async functions** for complex operations instead of long chains
  - [ ] **Example**: `const result = await operation();` instead of `operation().then(result => ...)`
- [ ] **🚨 MANDATORY: NO FALLBACK BEHAVIOR - Always throw errors instead**
  - [ ] **Never handle "legacy formats"** - expect the current format or fail fast
  - [ ] **No "try other common fields"** fallback logic - if expected field missing, throw error
  - [ ] **Fail fast and clearly** - don't mask issues with fallback behavior
  - [ ] **Single expected response format** - based on current API contract
  - [ ] **Throw descriptive errors** - explain exactly what format was expected vs received
  - [ ] **Example**: `if (!expectedFormat) throw new Error('Expected X format, got Y');`
- [ ] **Ensure responsive design (mobile-first approach with Tailwind breakpoints)**
- [ ] **Test components in both light and dark mode**
- [ ] **Verify mobile usability on devices 320px width and up**
- [ ] Follow accessibility guidelines (WCAG AA)
- [ ] Use semantic HTML elements
- [ ] **🚨 MANDATORY: Clean up removal artifacts**
  - [ ] **Never leave placeholder comments** like "// Combined field removed" or "// Separated into two fields"
  - [ ] **Delete empty functions/components** completely rather than leaving commented stubs
  - [ ] **Remove unused imports** and dependencies after deletions
  - [ ] **Clean up empty interfaces/types** that no longer serve a purpose
  - [ ] **Remove dead code paths** rather than commenting them out
  - [ ] **If removing code, remove it completely** - don't leave explanatory comments about what was removed

### Architecture Compliance
- [x] **✅ VERIFY: Used correct data access pattern**
  - [x] Mutations → Server Actions (`app/actions/[feature].ts`) - Not applicable, form changes only
  - [x] Queries → lib functions (`lib/[feature].ts`) for complex, direct in components for simple - Not applicable
  - [x] API routes → Only for webhooks, file exports, external integrations - Not applicable
- [x] **🚨 VERIFY: No server/client boundary violations in lib files** - Not applicable, no lib file changes
- [x] **🚨 VERIFY: No re-exports of non-async functions from Server Action files** - Not applicable
- [x] **🚨 VERIFY: Proper context usage patterns** - Not applicable, uses local form state
- [x] **❌ AVOID: Creating unnecessary API routes for internal operations** - Not applicable
- [x] **❌ AVOID: Mixing server-only imports with client-safe utilities in same file** - Not applicable
- [x] **❌ AVOID: Prop drilling when context providers already contain the needed data** - Not applicable
- [x] **🔍 DOUBLE-CHECK: Does this really need an API route or should it be a Server Action/lib function?** - Not applicable
- [x] **🔍 DOUBLE-CHECK: Can client components safely import from all lib files they need?** - Not applicable
- [x] **🔍 DOUBLE-CHECK: Are components using context hooks instead of receiving context data as props?** - Not applicable

---

## 17. Notes & Additional Context

### Research Links
- [Amazon ASIN Documentation](https://www.amazon.com/gp/help/customer/display.html?nodeId=201936990) - Reference for ASIN format validation
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview) - For any future schema changes
- [Shadcn UI Forms](https://ui.shadcn.com/docs/components/form) - Reference for form component patterns

### **⚠️ Common Server/Client Boundary Pitfalls to Avoid**
**Not applicable** - this task involves no server/client boundary changes.

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

Before implementing any changes, the AI must systematically analyze potential second-order consequences and alert the user to any significant impacts. This analysis should identify ripple effects that might not be immediately obvious but could cause problems later.

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [x] **Existing API Contracts:** Will this change break existing API endpoints or data contracts?
  - **Analysis:** No API changes - pure UI/form modification
- [x] **Database Dependencies:** Are there other tables/queries that depend on data structures being modified?
  - **Analysis:** No database schema changes - SKU and ASIN fields already exist separately
- [x] **Component Dependencies:** Which other components consume the interfaces/props being changed?
  - **Analysis:** `VariationConfig` type change affects:
    - `VariationsModal.tsx` (being modified)
    - `VariationsTableModal.tsx` (being modified)
    - `ProductEditDialog.tsx` (uses the config, already handles both fields)
- [x] **Authentication/Authorization:** Will this change affect existing user permissions or access patterns?
  - **Analysis:** No authentication changes - admin-only product management remains unchanged

#### 2. **Ripple Effects Assessment**
- [x] **Data Flow Impact:** How will changes to data models affect downstream consumers?
  - **Analysis:** Product data structure unchanged (already has both fields), consumers already handle them
- [x] **UI/UX Cascading Effects:** Will component changes require updates to parent/child components?
  - **Analysis:** Product row display change is isolated, variation table changes are internal to variation system
- [x] **State Management:** Will new data structures conflict with existing state management patterns?
  - **Analysis:** No conflicts - `formState` already supports both `sku` and `asin` as separate properties
- [x] **Routing Dependencies:** Are there route dependencies that could be affected by page structure changes?
  - **Analysis:** No routing changes - all modifications within existing product edit dialog

#### 3. **Performance Implications**
- [x] **Database Query Impact:** Will new queries or schema changes affect existing query performance?
  - **Analysis:** No query changes - both fields already selected in existing queries
- [x] **Bundle Size:** Are new dependencies significantly increasing the client-side bundle?
  - **Analysis:** No new dependencies - using existing form components
- [x] **Server Load:** Will new endpoints or operations increase server resource usage?
  - **Analysis:** No server changes - client-side form only
- [x] **Caching Strategy:** Do changes invalidate existing caching mechanisms?
  - **Analysis:** No caching impact - form state is ephemeral

#### 4. **Security Considerations**
- [x] **Attack Surface:** Does this change introduce new potential security vulnerabilities?
  - **Analysis:** No new attack surface - same field validation as before (ASIN sanitization already exists)
- [x] **Data Exposure:** Are there risks of inadvertently exposing sensitive data?
  - **Analysis:** No sensitive data exposure - SKU and ASIN are already public product identifiers
- [x] **Permission Escalation:** Could new features accidentally bypass existing authorization checks?
  - **Analysis:** No permission changes - admin-only form remains admin-only
- [x] **Input Validation:** Are all new data entry points properly validated?
  - **Analysis:** ✅ ASIN already has sanitization, SKU needs basic validation added

#### 5. **User Experience Impacts**
- [x] **Workflow Disruption:** Will changes to familiar interfaces confuse existing users?
  - **Analysis:** ⚠️ **YELLOW FLAG** - Users familiar with single "SKU / ASIN" field will need to adapt to two separate fields
  - **Mitigation:** Clear labeling, existing ASIN auto-fetch behavior preserved
- [x] **Data Migration:** Do users need to take action to migrate existing data?
  - **Analysis:** No user action required - existing data works as-is (optional cleanup available for misplaced ASINs)
- [x] **Feature Deprecation:** Are any existing features being removed or significantly changed?
  - **Analysis:** No features removed - separation is enhancement, all existing functionality preserved
- [x] **Learning Curve:** Will new features require additional user training or documentation?
  - **Analysis:** Minimal - field separation is intuitive, variation ASIN toggle follows existing pattern

#### 6. **Maintenance Burden**
- [x] **Code Complexity:** Are we introducing patterns that will be harder to maintain?
  - **Analysis:** No - separation reduces complexity (clearer data flow, no field ambiguity)
- [x] **Dependencies:** Are new third-party dependencies reliable and well-maintained?
  - **Analysis:** No new dependencies
- [x] **Testing Overhead:** Will this change require significant additional test coverage?
  - **Analysis:** Manual testing only (user browser testing), no automated test changes
- [x] **Documentation:** What new documentation will be required for maintainers?
  - **Analysis:** Minimal - task document serves as implementation documentation

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
**No critical red flags identified** for this implementation.

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [x] **UI/UX Changes:** Field separation changes familiar user workflow
  - **Severity:** Low - improvement outweighs disruption
  - **Mitigation:** Clear field labels, existing auto-fetch behavior preserved
  - **User Decision:** Already approved in strategic analysis (Option 1)

- [x] **Data Cleanup Opportunity:** Some products may have ASINs in SKU field
  - **Severity:** Low - does not block functionality
  - **Mitigation:** Optional cleanup script can be run later
  - **User Decision:** Deferred - not required for initial implementation

### Mitigation Strategies

#### Database Changes
**Not applicable** - no database migrations required.

#### API Changes
**Not applicable** - no API changes involved.

#### UI/UX Changes
- [x] **Feature Flags:** Not needed - UI change is an improvement, no gradual rollout required
- [x] **User Communication:** Task document serves as change documentation
- [x] **Help Documentation:** No formal docs needed - field labels are self-explanatory
- [x] **Feedback Collection:** User browser testing phase will validate UX improvements

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** Fill out all sections of the impact assessment
- [x] **Identify Critical Issues:** Flag any red or yellow flag items
- [x] **Propose Mitigation:** Suggest specific mitigation strategies for identified risks
- [x] **Alert User:** Clearly communicate any significant second-order impacts
- [x] **Recommend Alternatives:** If high-risk impacts are identified, suggest alternative approaches

### Example Analysis Template

```
🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:**
- None - UI change only, no API or database schema modifications

**Performance Implications:**
- No performance impact - same number of form fields, no additional queries

**Security Considerations:**
- ✅ Input validation: ASIN already sanitized, SKU needs basic validation
- ✅ No new attack surface introduced

**User Experience Impacts:**
- ⚠️ Field separation changes familiar workflow (1 field → 2 fields)
- ✅ Mitigation: Clear labels, preserved auto-fetch behavior, intuitive separation

**Maintenance Burden:**
- ✅ Reduced complexity - explicit field separation easier to maintain than combined field
- ✅ No new dependencies or testing overhead

**Mitigation Recommendations:**
- Optional data cleanup for misplaced ASINs (deferred, not blocking)
- User browser testing to validate UX improvement

**🚨 USER ATTENTION REQUIRED:**
No critical issues identified. This is a low-risk UI improvement with minimal user disruption. The field separation improves data clarity and aligns with the existing database schema.
```

---

*Template Version: 1.3*
*Last Updated: 12/23/2025*
*Created By: Brandon Hancock*
