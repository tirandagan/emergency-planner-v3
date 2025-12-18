# Browser Testing Checklist
## Task: Product Catalog Context Menu Implementation

**Date:** 2025-12-18
**Tester:** _________
**Browser:** _________
**Theme Tested:** ☐ Light Mode  ☐ Dark Mode

---

## 1. Context Menu Functionality

### Product Catalog - Main Categories
- [ ] **Right-click main category** (e.g., "Food & Water")
  - [ ] Context menu appears at cursor position
  - [ ] Menu shows "Edit" and "Delete" options
  - [ ] Menu has proper styling (rounded, shadow, readable text)
  - [ ] Menu closes when clicking outside
  - [ ] Menu closes when pressing Escape key

### Product Catalog - Subcategories
- [ ] **Right-click subcategory** (e.g., "Water Storage")
  - [ ] Context menu appears at cursor position
  - [ ] Menu shows "Edit" and "Delete" options
  - [ ] Works the same as main categories

---

## 2. Edit Category Dialog

### Accessing the Dialog
- [ ] **Click "Edit" from context menu**
  - [ ] Dialog opens immediately
  - [ ] Dialog title says "Edit Category"
  - [ ] All fields are populated with current values

### Field Functionality
- [ ] **Category Name field**
  - [ ] Shows current name
  - [ ] Can edit text
  - [ ] Text selection has good contrast (highlighted text is readable)
  - [ ] Required field validation works (can't save if empty)

- [ ] **Icon Picker**
  - [ ] Shows current icon
  - [ ] "Choose Icon" button opens emoji picker
  - [ ] Can select new emoji
  - [ ] Selected emoji updates immediately

- [ ] **URL Slug Preview**
  - [ ] Shows auto-generated slug
  - [ ] Updates as you type in name field
  - [ ] Is read-only (can't edit directly)
  - [ ] Text has good contrast

- [ ] **Description field**
  - [ ] Shows current description (or blank)
  - [ ] Can edit text (multiline)
  - [ ] Text selection has good contrast
  - [ ] Optional field (can be left blank)

- [ ] **Created date**
  - [ ] Shows creation date
  - [ ] Is read-only
  - [ ] Formatted correctly

### Saving Changes
- [ ] **Click "Save Changes"**
  - [ ] Button disables during save
  - [ ] Shows "Saving..." text
  - [ ] Dialog closes after successful save
  - [ ] Category name updates in the list
  - [ ] Category icon updates if changed

### Cancel/Close
- [ ] **Click "Cancel"** - Dialog closes without saving
- [ ] **Click X** or **press Escape** - Dialog closes without saving
- [ ] **Click outside dialog** - Dialog closes without saving

---

## 3. Delete Category Dialog

### Delete - Category WITHOUT Master Items
- [ ] **Find an empty category** (no products inside)
- [ ] **Right-click → Delete**
  - [ ] Dialog opens showing "Delete Category?"
  - [ ] Shows category name and icon
  - [ ] Impact summary shows: 0 subcategories, 0 master items
  - [ ] Confirmation input field is present
  - [ ] Delete button is ENABLED
  - [ ] Type category name to confirm
  - [ ] Delete button becomes clickable when name matches
  - [ ] Click "Delete" - category is removed from list
  - [ ] Page refreshes and category is gone

### Delete - Category WITH Master Items
- [ ] **Find a category with products** (e.g., "Food & Water")
- [ ] **Right-click → Delete**
  - [ ] Dialog opens showing "Delete Category?"
  - [ ] Impact summary shows: X subcategories, Y master items
  - [ ] Shows list of affected items (first 5)
  - [ ] Delete button is DISABLED (or shows error)
  - [ ] Warning message indicates deletion is blocked
  - [ ] Cannot proceed with deletion
  - [ ] Click "Cancel" - dialog closes, nothing deleted

---

## 4. Category Manager Regression Testing

**IMPORTANT:** Verify the category manager still works after refactoring!

Navigate to: `/admin/categories`

### Context Menu in Category Manager
- [ ] **Right-click a category**
  - [ ] Context menu appears
  - [ ] Shows "Rename", "Edit", "Delete" options
  - [ ] Edit opens the SAME dialog as product catalog
  - [ ] Delete opens the SAME dialog as product catalog

### Rename Functionality
- [ ] **Click "Rename" from context menu**
  - [ ] Enables inline editing
  - [ ] Can type new name
  - [ ] Press Enter to save
  - [ ] Press Escape to cancel

### Create New Category
- [ ] **Click "+" button to create new category**
  - [ ] Dialog opens with "Create Category" title
  - [ ] Can enter name, icon, description
  - [ ] Click "Create" - new category appears

---

## 5. Theme Testing

### Light Mode
- [ ] **Switch to light mode** (if applicable)
  - [ ] Context menu readable (dark text on light background)
  - [ ] Edit dialog readable
  - [ ] Button has good contrast
  - [ ] Selected text in input fields is readable
  - [ ] All labels and hints are readable

### Dark Mode
- [ ] **Switch to dark mode** (if applicable)
  - [ ] Context menu readable (light text on dark background)
  - [ ] Edit dialog readable
  - [ ] Button has good contrast
  - [ ] Selected text in input fields is readable
  - [ ] All labels and hints are readable

---

## 6. Edge Cases & Error Handling

### Network/Server Errors
- [ ] **With dev tools open** (Network tab):
  - [ ] Try editing a category
  - [ ] If save fails, appropriate error message shows
  - [ ] Dialog doesn't close on error
  - [ ] Can retry after fixing the issue

### Special Characters
- [ ] **Edit category name to include**:
  - [ ] Spaces: "My Category Name" ✓
  - [ ] Hyphens: "My-Category" ✓
  - [ ] Numbers: "Category 123" ✓
  - [ ] Emojis: "🎉 Party Category" ✓
  - [ ] URL slug generates correctly for all

### Long Names
- [ ] **Edit category name to be very long** (100+ characters)
  - [ ] Input field handles long text
  - [ ] URL slug truncates/handles appropriately
  - [ ] List display doesn't break layout

---

## 7. Integration Testing

### Both Pages Use Same Dialogs
- [ ] **Edit a category in product catalog**
  - [ ] Make a change (e.g., update name)
  - [ ] Go to category manager
  - [ ] Right-click same category → Edit
  - [ ] Verify change is reflected (confirms same backend)

- [ ] **Edit a category in category manager**
  - [ ] Make a change
  - [ ] Go to product catalog
  - [ ] Right-click same category → Edit
  - [ ] Verify change is reflected

---

## 8. Keyboard Accessibility

- [ ] **Tab key** navigates through dialog fields
- [ ] **Escape key** closes context menu and dialogs
- [ ] **Enter key** submits forms when appropriate
- [ ] All interactive elements are keyboard-accessible

---

## Issues Found

| # | Severity | Description | Steps to Reproduce |
|---|----------|-------------|-------------------|
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |

**Severity Levels:** 🔴 Critical | ⚠️ High | 🟡 Medium | 🔵 Low

---

## Sign-Off

- [ ] **All critical tests passed**
- [ ] **No blocking issues found**
- [ ] **Ready for production**

**Tester Signature:** _________
**Date:** _________
**Notes:**

---

## Quick Reference

**Files Modified:**
- `components/admin/category-dialogs/EditCategoryDialog.tsx`
- `components/admin/category-dialogs/CreateCategoryDialog.tsx`
- `components/admin/category-dialogs/index.ts`
- `app/(protected)/admin/categories/page.tsx`
- `app/(protected)/admin/products/page.client.tsx`

**Feature:** Right-click context menu on categories with Edit/Delete functionality
**Goal:** Enable category management directly from product catalog without using category manager
