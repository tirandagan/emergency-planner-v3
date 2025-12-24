# 🎯 Product Edit Dialog UI Modernization - Resumption Guide

**Task Reference:** [076_product_edit_dialog_collapsible_ui_modernization.md](076_product_edit_dialog_collapsible_ui_modernization.md)

## ✅ What's Complete (Phases 1-2)

### Phase 1: Infrastructure Setup ✅
**All imports, state hooks, and reset logic in place:**
- ✅ Collapsible components imported (`Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`)
- ✅ ChevronDown/ChevronUp icons imported
- ✅ 7 section state hooks added (lines 102-108 of ProductEditDialog.tsx)
  - `identityOpen`, `pricingOpen`, `classificationOpen`, `categorizationOpen`
  - `inventoryOpen`, `variationsOpen`, `attributesOpen`
  - All default to `true` (open)
- ✅ Reset logic in useEffect (lines 130-137)
  - Resets all sections to OPEN when dialog opens

### Phase 2: Underlined Input Components ✅
**All reusable components created and exported:**

1. ✅ **UnderlinedInput.tsx** - Clean underlined input (40% less vertical space)
   - Location: `src/app/(protected)/admin/products/components/UnderlinedInput.tsx`
   - Features: Border-bottom only, reduced padding (py-1.5 vs py-2.5), error states

2. ✅ **UnderlinedSelect.tsx** - Underlined dropdown select
   - Location: `src/app/(protected)/admin/products/components/UnderlinedSelect.tsx`
   - Features: Matches UnderlinedInput styling, supports error states

3. ✅ **UnderlinedTextarea.tsx** - Underlined multi-line input
   - Location: `src/app/(protected)/admin/products/components/UnderlinedTextarea.tsx`
   - Features: Resize-none, matches underlined pattern

4. ✅ **CollapsibleSection.tsx** - Reusable section wrapper
   - Location: `src/app/(protected)/admin/products/components/CollapsibleSection.tsx`
   - Features: Icon, title, preview summary, badge, chevron indicators
   - Props: `title`, `icon`, `isOpen`, `onToggle`, `preview?`, `badge?`, `children`

5. ✅ **ProductFormElements.tsx** updated
   - Lines 36-39: Exports all underlined variants
   - Usage: `import { UnderlinedInput, UnderlinedSelect, UnderlinedTextarea } from './ProductFormElements'`

---

## 🔄 Next Steps (Phases 3-8)

### Phase 3: Section Restructuring (1.5 hours) - **START HERE**

**Goal:** Transform two-column layout to single-column with collapsible sections

**Current Structure (ProductEditDialog.tsx):**
```tsx
// Line 841: Two-column grid layout
<div className="grid grid-cols-12 gap-0 min-h-full">
  {/* LEFT COLUMN (lines 844-1114) */}
  <div className="col-span-12 lg:col-span-8 p-8 border-r border-border space-y-8">
    {/* Product Identity (873-950) */}
    {/* Categorization (952-1001) */}
    {/* Classification (1004-1113) */}
  </div>

  {/* RIGHT COLUMN (lines 1116-1381) */}
  <div className="col-span-12 lg:col-span-4 bg-muted p-8 space-y-8">
    {/* Pricing & Type (1120-1142) */}
    {/* Inventory & Supplier (1144-1214) */}
    {/* Variations (1217-1252) */}
    {/* Attributes (1255-1381) */}
  </div>
</div>
```

**Target Structure:**
```tsx
// Single-column with collapsible sections
<div className="p-8 space-y-4">
  {/* Suggestions Bar (if suggestions exist) */}

  <CollapsibleSection title="Product Identity" icon={Package} isOpen={identityOpen} onToggle={setIdentityOpen}>
    {/* Product name, URLs, image, description */}
  </CollapsibleSection>

  <CollapsibleSection title="Pricing & Type" icon={DollarSign} isOpen={pricingOpen} onToggle={setPricingOpen}>
    {/* Price, Package Size, Required Qty (side-by-side), Fulfillment Type */}
  </CollapsibleSection>

  <CollapsibleSection title="Classification" icon={Target} isOpen={classificationOpen} onToggle={setClassificationOpen}>
    {/* Scenarios, Demographics, Timeframes, Locations, X1 multiplier */}
  </CollapsibleSection>

  <CollapsibleSection title="Categorization" icon={Layers} isOpen={categorizationOpen} onToggle={setCategorizationOpen}>
    {/* Category, Subcategory, Master Item */}
  </CollapsibleSection>

  <CollapsibleSection title="Inventory & Supplier" icon={Package} isOpen={inventoryOpen} onToggle={setInventoryOpen}>
    {/* SKU, ASIN, Supplier, Package Size, Required Quantity, Status */}
  </CollapsibleSection>

  <CollapsibleSection title="Variations" icon={Settings2} isOpen={variationsOpen} onToggle={setVariationsOpen}>
    {/* Variations configuration */}
  </CollapsibleSection>

  <CollapsibleSection title="Attributes" icon={Tags} isOpen={attributesOpen} onToggle={setAttributesOpen}>
    {/* Metadata fields: brand, model, dimensions, weight, color, size, etc. */}
  </CollapsibleSection>
</div>
```

**Implementation Steps:**

**Step 3.1:** Add CollapsibleSection import
```tsx
import { CollapsibleSection } from './CollapsibleSection';
```

**Step 3.2:** Replace grid wrapper (line 841)
```tsx
// Before:
<div className="grid grid-cols-12 gap-0 min-h-full">

// After:
<div className="p-8 space-y-4">
```

**Step 3.3:** Remove column divs and wrap first section
```tsx
// Remove: <div className="col-span-12 lg:col-span-8 p-8 border-r border-border space-y-8">
// Keep suggestions bar (if needed)
// Wrap Product Identity section in CollapsibleSection
```

**Step 3.4:** Move Pricing section from right column to position #2
- Cut lines 1120-1142 (Pricing & Type card content)
- Wrap in CollapsibleSection with DollarSign icon
- Place immediately after Product Identity section

**Step 3.5:** Wrap remaining sections in CollapsibleSection
- Classification (lines 1004-1113)
- Categorization (lines 952-1001)
- Inventory (lines 1144-1214)
- Variations (lines 1217-1252)
- Attributes (lines 1255-1381)

---

### Phase 4: Smart Field Grouping (45 min)

**Goal:** Optimize field layouts for better space utilization

**Key Changes:**

1. **Pricing Section** - Group narrow numeric fields:
```tsx
<div className="grid grid-cols-3 gap-4">
  <InputGroup label="Price ($)" required>
    <UnderlinedInput type="number" step="0.01" className="text-right font-mono" />
  </InputGroup>
  <InputGroup label="Package Size" required>
    <UnderlinedInput type="number" className="text-right font-mono" />
  </InputGroup>
  <InputGroup label="Required Qty" required>
    <UnderlinedInput type="number" className="text-right font-mono" />
  </InputGroup>
</div>
```

2. **Inventory Section** - Group SKU and ASIN:
```tsx
<div className="grid grid-cols-2 gap-4">
  <InputGroup label="SKU">
    <UnderlinedInput ... />
  </InputGroup>
  <InputGroup label="ASIN">
    <UnderlinedInput maxLength={10} ... />
  </InputGroup>
</div>
```

3. **Identity Section** - Group URL fields:
```tsx
<div className="grid grid-cols-2 gap-6">
  <InputGroup label="Product Page URL" required>
    <UnderlinedInput type="url" ... />
  </InputGroup>
  <InputGroup label="Image URL">
    <UnderlinedInput type="url" ... />
  </InputGroup>
</div>
```

---

### Phase 5: Preview Summaries (30 min)

**Goal:** Show one-line summaries in collapsed section headers

**Implementation Pattern:**
```tsx
<CollapsibleSection
  title="Pricing & Type"
  icon={DollarSign}
  isOpen={pricingOpen}
  onToggle={setPricingOpen}
  preview={!pricingOpen ? (
    `$${formState.price || '0.00'} • ${formState.type || 'Affiliate'}`
  ) : undefined}
>
```

**Add previews to:**
- Pricing: `$29.99 • Affiliate`
- Inventory: `SKU: XXX • Supplier: Amazon`
- Classification: `4 tags selected`
- Categorization: `Category > Subcategory > Master Item`

---

### Phase 6: Auto-Expand Logic (45 min)

**Goal:** Auto-expand sections with suggestions or errors

**Add useEffect for suggestion detection:**
```tsx
useEffect(() => {
  if (!productSuggestions) return;

  // Auto-expand sections with new suggestions
  if (productSuggestions.price || productSuggestions.type) {
    setPricingOpen(true);
  }
  if (productSuggestions.name || productSuggestions.description ||
      productSuggestions.productUrl || productSuggestions.imageUrl) {
    setIdentityOpen(true);
  }
  if (productSuggestions.sku || productSuggestions.asin) {
    setInventoryOpen(true);
  }
}, [productSuggestions]);
```

**Add notification badges:**
```tsx
<CollapsibleSection
  title="Pricing & Type"
  icon={DollarSign}
  isOpen={pricingOpen}
  onToggle={setPricingOpen}
  badge={!pricingOpen && (productSuggestions?.price || productSuggestions?.type) ? (
    <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">
      • Suggestions
    </span>
  ) : undefined}
>
```

---

### Phase 7: Polish & Responsive (30 min)

**Tasks:**
- Add red asterisks to required field labels
- Test mobile responsive behavior (<768px)
- Ensure smooth CollapsibleContent transitions
- Verify light/dark mode consistency

---

### Phase 8: Comprehensive Testing (30 min)

**Test Checklist:**
- [ ] Form submission with all sections collapsed
- [ ] Amazon auto-fill triggers section expansion
- [ ] Validation errors expand correct sections
- [ ] All modals work (Supplier, MasterItem, Variations, Search)
- [ ] Keyboard navigation (Tab, Enter/Space)
- [ ] Light and dark mode
- [ ] Mobile responsiveness

---

## 📝 Quick Reference

**File Locations:**
- Main dialog: `src/app/(protected)/admin/products/components/ProductEditDialog.tsx`
- Underlined inputs: `src/app/(protected)/admin/products/components/Underlined*.tsx`
- Collapsible helper: `src/app/(protected)/admin/products/components/CollapsibleSection.tsx`
- Form elements: `src/app/(protected)/admin/products/components/ProductFormElements.tsx`

**State Hooks (lines 102-108):**
```tsx
const [identityOpen, setIdentityOpen] = useState(true);
const [pricingOpen, setPricingOpen] = useState(true);
const [classificationOpen, setClassificationOpen] = useState(true);
const [categorizationOpen, setCategorizationOpen] = useState(true);
const [inventoryOpen, setInventoryOpen] = useState(true);
const [variationsOpen, setVariationsOpen] = useState(true);
const [attributesOpen, setAttributesOpen] = useState(true);
```

**CollapsibleSection Usage:**
```tsx
import { CollapsibleSection } from './CollapsibleSection';

<CollapsibleSection
  title="Section Name"
  icon={IconComponent}
  isOpen={sectionOpen}
  onToggle={setSectionOpen}
  preview="Optional preview text"
  badge={<span>Optional badge</span>}
>
  {/* Section content */}
</CollapsibleSection>
```

---

## 🚀 To Resume

1. Open `ProductEditDialog.tsx` in your editor
2. Start with Phase 3, Step 3.1
3. Work through each phase sequentially
4. Update task checkboxes in `076_product_edit_dialog_collapsible_ui_modernization.md` as you complete each step
5. Test thoroughly after each major phase

**Estimated Time Remaining:** 2.5-3 hours for Phases 3-8

Good luck! 🎯
