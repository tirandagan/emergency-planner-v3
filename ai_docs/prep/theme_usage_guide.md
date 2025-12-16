# Trust Blue Theme Usage Guide
**App Name:** beprepared.ai  
**Theme:** Trust Blue (Professional Emergency Preparedness)  
**Created:** 2025-12-09

---

## 🎨 Theme Overview

The **Trust Blue** theme is the visual foundation for all new pages and components in beprepared.ai. This theme provides:
- Professional, trustworthy appearance
- Calm confidence for emergency preparedness context
- Full light/dark mode support
- WCAG AAA accessibility compliance
- Blue-tinted neutrals for brand cohesion

### Brand Identity
- **App Name:** beprepared.ai (NOT PrepperAI)
- **Primary Color:** Trust Blue HSL(220, 85%, 55%)
- **Design Personality:** Trustworthy, calm authority, empowering, professional
- **Target Audience:** Families seeking disaster preparedness guidance

---

## 🚀 Quick Start

All Trust Blue theme colors are available as Tailwind CSS utility classes through CSS custom properties defined in `src/app/globals.css`.

### Basic Usage Example
```tsx
// ✅ Good - Uses Trust Blue theme
export default function MyComponent() {
  return (
    <div className="bg-background text-foreground">
      <h1 className="text-2xl font-bold text-foreground">Welcome to beprepared.ai</h1>
      <button className="bg-primary text-primary-foreground hover:bg-primary/90">
        Get Started
      </button>
      <p className="text-muted-foreground">Professional emergency preparedness</p>
    </div>
  );
}
```

---

## 🎨 Available Colors

### Primary Colors
| Class | Usage | Light Mode | Dark Mode |
|---|---|---|---|
| `bg-primary` | Primary brand color | HSL(220, 85%, 55%) | HSL(220, 75%, 65%) |
| `text-primary` | Primary text color | Blue #2563eb | Light Blue #60a5fa |
| `bg-primary-foreground` | Text on primary bg | Nearly white | Off-white |
| `border-primary` | Primary borders | Trust Blue | Trust Blue |
| `ring-primary` | Focus rings | Trust Blue | Trust Blue |

### Background System
| Class | Usage | Light Mode | Dark Mode |
|---|---|---|---|
| `bg-background` | Main content areas | Pure white | Blue-tinted dark HSL(220, 15%, 8%) |
| `text-foreground` | Body text | Dark gray | Off-white |
| `bg-muted` | Secondary surfaces | Light gray | Blue-tinted muted HSL(220, 12%, 15%) |
| `text-muted-foreground` | Secondary text | Medium gray | Muted gray |

### Component Surfaces
| Class | Usage | Description |
|---|---|---|
| `bg-card` | Card backgrounds | Same as `background` |
| `text-card-foreground` | Text on cards | Same as `foreground` |
| `bg-popover` | Popup backgrounds | Same as `background` |
| `text-popover-foreground` | Text on popups | Same as `foreground` |

### Secondary Actions
| Class | Usage | Description |
|---|---|---|
| `bg-secondary` | Secondary buttons, badges | Light gray / Muted dark |
| `text-secondary-foreground` | Text on secondary elements | Dark / Light |

### Status Colors
| Class | Usage | Light Mode | Dark Mode |
|---|---|---|---|
| `bg-success` | Success states | HSL(120, 60%, 45%) | HSL(120, 55%, 50%) |
| `text-success` | Success text | Professional green | Brighter green |
| `bg-warning` | Warning states | HSL(45, 80%, 55%) | HSL(45, 75%, 60%) |
| `text-warning` | Warning text | Professional amber | Brighter amber |
| `bg-destructive` | Error states | HSL(0, 70%, 50%) | HSL(0, 65%, 55%) |
| `text-destructive` | Error text | Business red | Brighter red |

### Borders & Inputs
| Class | Usage | Description |
|---|---|---|
| `border-border` | Standard borders | Subtle gray / Dark border |
| `border-input` | Input borders | Same as borders |
| `ring-ring` | Focus rings | Trust Blue (primary) |

---

## 📐 Layout Patterns

### Standard Page Layout
```tsx
export default function StandardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation (Navbar component) */}
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">Page Title</h1>
          
          {/* Page content */}
        </div>
      </main>
      
      {/* Footer component */}
    </div>
  );
}
```

### Card/Section Pattern
```tsx
<div className="bg-card border border-border rounded-lg p-6 shadow-sm">
  <h2 className="text-xl font-semibold text-card-foreground mb-4">Section Title</h2>
  <p className="text-muted-foreground mb-4">Section description text</p>
  
  {/* Section content */}
</div>
```

### Button Pattern (Using shadcn Button)
```tsx
import { Button } from "@/components/ui/button";

// Primary action
<Button variant="default">Save</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Success action
<Button className="bg-success text-success-foreground hover:bg-success/90">
  Complete
</Button>
```

---

## 🌓 Light/Dark Mode Support

The theme automatically adapts to light/dark mode through Tailwind's `dark:` prefix. The CSS variables change automatically.

### Dark Mode Classes (Automatic)
```tsx
// No need for dark: prefix when using theme variables
// These work automatically:
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Adapts automatically</p>
</div>

// If you need custom dark mode styling:
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">Custom dark mode</p>
</div>
```

---

## ❌ Legacy Theme Classes to Avoid

### Forbidden Classes (Old "Tactical" Theme)
**DO NOT USE** these classes in new components:

| ❌ Forbidden Class | ✅ Use Instead |
|---|---|
| `bg-tactical-black` | `bg-background` |
| `text-tactical-accent` | `text-primary` |
| `bg-tactical-dark` | `bg-muted` |
| `bg-gray-900` | `bg-background` (in dark mode) |
| `text-gray-100` | `text-foreground` |
| `border-gray-800` | `border-border` |
| `bg-gray-800` | `bg-muted` or `bg-secondary` |
| Hardcoded HSL values | CSS variable classes |

### Legacy Branding to Avoid
- ❌ "PrepperAI"
- ❌ "Prepper AI"
- ❌ "PrepperAI Systems"
- ✅ Use: "beprepared.ai"

---

## 📦 Component Examples

### Alert/Notification
```tsx
<div className="border border-border rounded-lg p-4 bg-card">
  <div className="flex gap-3">
    <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
    <div>
      <h3 className="font-semibold text-card-foreground mb-1">Warning</h3>
      <p className="text-sm text-muted-foreground">
        Important information about your emergency plan.
      </p>
    </div>
  </div>
</div>
```

### Form Input
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-foreground">
    Email Address
  </label>
  <input
    type="email"
    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
    placeholder="you@example.com"
  />
  <p className="text-sm text-muted-foreground">
    We&rsquo;ll never share your email.
  </p>
</div>
```

### Status Badge
```tsx
// Success
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
  ✓ Complete
</span>

// Warning
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
  ⚠ Pending
</span>

// Error
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
  ✗ Failed
</span>
```

---

## 🎯 Best Practices

### DO ✅
- Use CSS variable classes (`bg-primary`, `text-foreground`, etc.)
- Use shadcn/ui components when available
- Test components in both light and dark mode
- Use semantic color names (success, warning, destructive)
- Follow the two-background system (background vs muted)
- Use "beprepared.ai" branding consistently

### DON'T ❌
- Use legacy tactical theme classes (`bg-tactical-black`, etc.)
- Hardcode color values (no `bg-blue-600`, use `bg-primary`)
- Mix old and new theme approaches in the same file
- Use "PrepperAI" branding
- Ignore dark mode support
- Create custom color classes when theme variables exist

---

## 🔄 Migration from Legacy Theme

### Step 1: Replace Background Classes
```tsx
// ❌ Old (tactical theme)
<nav className="bg-tactical-black border-b border-gray-800">

// ✅ New (Trust Blue theme)
<nav className="bg-background border-b border-border">
```

### Step 2: Replace Text Classes
```tsx
// ❌ Old
<span className="text-gray-100">White text</span>
<span className="text-gray-500">Muted text</span>

// ✅ New
<span className="text-foreground">Body text</span>
<span className="text-muted-foreground">Muted text</span>
```

### Step 3: Replace Accent Colors
```tsx
// ❌ Old
<button className="text-tactical-accent hover:text-yellow-400">

// ✅ New
<button className="text-primary hover:text-primary/90">
```

### Step 4: Update Branding
```tsx
// ❌ Old
<span>PREPPER<span className="text-tactical-accent">AI</span></span>

// ✅ New
<span className="text-xl font-semibold text-foreground">beprepared.ai</span>
```

---

## 📚 Additional Resources

- **Theme Definition:** `ai_docs/prep/ui_theme.md` - Complete Trust Blue specification
- **CSS Variables:** `src/app/globals.css` - All theme color definitions
- **shadcn/ui Docs:** [ui.shadcn.com](https://ui.shadcn.com) - Component library
- **Tailwind CSS:** [tailwindcss.com](https://tailwindcss.com) - Utility classes

---

**Last Updated:** 2025-12-09  
**Theme Version:** Trust Blue v1.0  
**App:** beprepared.ai

