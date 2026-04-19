# Design Guide

This document defines the visual style, UI patterns, and design conventions for the Aqua Graph frontend. All contributors and AI agents should follow these guidelines.

---

## Design Philosophy

The Aqua Graph interface is designed to feel like a **scientific monitoring dashboard** - clean, data-focused, and professional. The aesthetic draws from water/ocean imagery while maintaining high readability for data-intensive views.

### Core Attributes

- **Scientific & Professional** - Clean lines, clear typography, data-first
- **Ocean-Inspired** - Blues, teals, and aqua accents reflecting water/microplastics theme
- **Depth & Clarity** - Layered surfaces with subtle glassmorphism
- **Accessible** - High contrast, legible at all sizes

---

## Color System

### Light Mode Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.98 0.012 196.56)` | Page background |
| `--foreground` | `oklch(0.235 0.026 221.19)` | Primary text |
| `--card` | `oklch(0.996 0.006 180.47 / 0.92)` | Card surfaces |
| `--card-foreground` | `oklch(0.235 0.026 221.19)` | Card text |
| `--primary` | `oklch(0.49 0.11 212.84)` | Primary actions, links |
| `--primary-foreground` | `oklch(0.985 0.006 196.56)` | Text on primary |
| `--secondary` | `oklch(0.93 0.02 188.48)` | Secondary surfaces |
| `--secondary-foreground` | `oklch(0.25 0.025 221.19)` | Secondary text |
| `--muted` | `oklch(0.94 0.014 196.56)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.49 0.025 219.35)` | Muted text |
| `--accent` | `oklch(0.9 0.04 163.22)` | Accent/highlights |
| `--accent-foreground` | `oklch(0.2 0.02 221.19)` | Text on accent |
| `--destructive` | `oklch(0.63 0.18 25.33)` | Error states |
| `--border` | `oklch(0.83 0.018 205.11)` | Borders |
| `--input` | `oklch(0.9 0.012 198.6)` | Form inputs |
| `--ring` | `oklch(0.62 0.07 211.4)` | Focus rings |

### Dark Mode Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.18 0.02 228.7)` | Page background |
| `--foreground` | `oklch(0.94 0.01 190.4)` | Primary text |
| `--primary` | `oklch(0.72 0.1 194.3)` | Primary actions |
| `--primary-foreground` | `oklch(0.18 0.02 228.7)` | Text on primary |

### Chart Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--chart-1` | `oklch(0.58 0.17 232.1)` | Primary data series |
| `--chart-2` | `oklch(0.66 0.12 179.6)` | Secondary data series |
| `--chart-3` | `oklch(0.74 0.11 102.6)` | Tertiary data series |
| `--chart-4` | `oklch(0.71 0.12 35.9)` | Quaternary data series |
| `--chart-5` | `oklch(0.54 0.09 281.8)` | Quinary data series |

### Sidebar Colors

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--sidebar` | `oklch(0.97 0.01 196.56 / 0.9)` | `oklch(0.21 0.016 223.4 / 0.88)` |
| `--sidebar-foreground` | `oklch(0.22 0.02 221.19)` | `oklch(0.94 0.01 190.4)` |
| `--sidebar-primary` | `oklch(0.49 0.11 212.84)` | `oklch(0.72 0.1 194.3)` |
| `--sidebar-accent` | `oklch(0.9 0.04 163.22)` | `oklch(0.38 0.05 173.6)` |

---

## Typography

### Font Stack

| Token | Font | Fallback |
|-------|------|----------|
| `--font-sans` | "Avenir Next" | Segoe UI, Helvetica Neue, sans-serif |
| `--font-mono` | "IBM Plex Mono" | SFMono-Regular, Consolas, monospace |
| `--font-heading` | "Avenir Next" | Segoe UI, Helvetica Neue, sans-serif |

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|--------------|
| Page Title | 2rem (32px) | 700 | 1.2 |
| Section Title | 1.5rem (24px) | 600 | 1.3 |
| Card Title | 1.125rem (18px) | 600 | 1.4 |
| Body | 0.875rem (14px) | 400 | 1.5 |
| Small/Caption | 0.75rem (12px) | 400 | 1.5 |
| Eyebrow | 0.7rem (11px) | 500 | 1.0 |
| Mono/Code | 0.8125rem (13px) | 400 | 1.5 |

### Utility Classes

```html
<!-- Eyebrow text - uppercase, tracked, muted -->
<span class="eyebrow">Sample Count</span>

<!-- Page title -->
<h1 class="text-2xl font-bold">Dashboard</h1>

<!-- Body text -->
<p class="text-sm text-muted-foreground">Last updated 5 minutes ago</p>
```

---

## Spacing & Layout

### Base Unit

The design system uses a **1rem (16px)** base unit with these scale multipliers:

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.6rem | Small elements |
| `--radius-md` | 0.8rem | Medium elements |
| `--radius-lg` | 1rem | Cards, buttons |
| `--radius-xl` | 1.4rem | Large cards |
| `--radius-2xl` | 1.8rem | Panels |
| `--radius-3xl` | 2.2rem | Modals |

### Card Spacing

- Internal padding: `p-4` or `p-6`
- Gap between cards: `gap-4`
- Section spacing: `my-6` or `my-8`

### Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  App Shell (sidebar + main content)                         │
│  ┌──────────┬──────────────────────────────────────────────┐│
│  │ Sidebar  │  Main Content Area                           ││
│  │ (240px)  │  ┌────────────────────────────────────────┐  ││
│  │          │  │  Page Header (title + actions)         │  ││
│  │ Nav      │  ├────────────────────────────────────────┤  ││
│  │ Items    │  │                                        │  ││
│  │          │  │  Content (cards, tables, charts)       │  ││
│  │          │  │                                        │  ││
│  │          │  │                                        │  ││
│  │          │  └────────────────────────────────────────┘  ││
│  └──────────┴──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Component Patterns

### Surface (Glassy Panel)

Use the `.surface` utility for elevated card-like elements:

```css
.surface {
  border: 1px solid oklch(from var(--border) l c a / 60%);
  background: oklch(from var(--card) l c a / 85%);
  box-shadow: 0 20px 60px -36px rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(24px);
}
```

**Usage:**
```html
<div class="surface p-6 rounded-lg">
  <h3 class="font-semibold">Sample Details</h3>
  <p class="text-sm text-muted-foreground">Location data</p>
</div>
```

### Cards

```html
<Card>
  <CardHeader>
    <CardTitle>Total Samples</CardTitle>
    <CardDescription>All time collection</CardDescription>
  </CardHeader>
  <CardContent>
    <div class="text-3xl font-bold">1,234</div>
  </CardContent>
</Card>
```

### Buttons

| Variant | Style | Usage |
|---------|-------|-------|
| Default | Primary bg, white text | Main actions |
| Secondary | Secondary bg, foreground text | Secondary actions |
| Outline | Transparent, border | Tertiary actions |
| Ghost | Transparent, no border | Subtle actions |
| Destructive | Red bg, white text | Delete/danger |

### Badges

```html
<!-- Status badges -->
<span class="badge bg-green-100 text-green-800">Active</span>
<span class="badge bg-yellow-100 text-yellow-800">Pending</span>
<span class="badge bg-red-100 text-red-800">Error</span>
```

### Tables

```html
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Sample ID</TableHead>
      <TableHead>Date</TableHead>
      <TableHead>Estimate</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>abc-123</TableCell>
      <TableCell>2026-04-18</TableCell>
      <TableCell>12.4</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Forms

```html
<form>
  <div class="grid gap-4">
    <div class="grid gap-2">
      <Label for="email">Email</Label>
      <Input id="email" type="email" placeholder="user@example.com" />
    </div>
    <Button type="submit">Sign In</Button>
  </div>
</form>
```

---

## Background Effects

The body has a layered gradient background:

```css
body {
  background-image:
    radial-gradient(circle at top left, color-mix(in oklab, var(--accent) 26%, transparent) 0, transparent 34%),
    radial-gradient(circle at top right, color-mix(in oklab, var(--primary) 18%, transparent) 0, transparent 28%),
    linear-gradient(180deg, color-mix(in oklab, var(--background) 88%, white) 0%, var(--background) 100%);
}
```

This creates a subtle:
- **Top-left**: Accent tint (teal/green)
- **Top-right**: Primary tint (blue)
- **Bottom**: Soft gradient toward white

---

## Navigation (App Shell)

### Sidebar Structure

```
┌────────────────────┐
│  Aqua Graph        │  ← Logo/Brand
│  ─────────────     │
│                    │
│  📊 Dashboard      │  ← Nav items
│  🗺️ Map            │
│  📋 Samples        │
│  🔌 Devices        │
│  ⚙️ Admin          │
│                    │
│  ─────────────     │
│  User Info         │  ← User section
│  [Theme Toggle]    │
└────────────────────┘
```

### Navigation Item States

| State | Style |
|-------|-------|
| Default | Text-muted, no background |
| Hover | Background subtle, text foreground |
| Active | Primary text, accent background |
| Disabled | Opacity 50%, cursor not-allowed |

---

## Data Visualization

### Charts (Recharts)

- Use `--chart-1` through `--chart-5` tokens
- Keep labels minimal but readable
- Tooltips should match card styling

### Map (Leaflet)

- Use OpenStreetMap tiles (free, no API key)
- Custom markers in primary color
- Popups match surface/card styling

---

## Responsive Design

### Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom nav option |
| Tablet | 640-1024px | Collapsible sidebar |
| Desktop | > 1024px | Full sidebar |

### Mobile Considerations

- Use `< 768px` for mobile-specific styles
- Tables become scrollable or card views
- Sidebar becomes sheet/drawer
- Touch targets minimum 44px

---

## Accessibility

### Color Contrast

- Text on background: minimum 4.5:1 (WCAG AA)
- Large text: minimum 3:1
- UI components: minimum 3:1

### Focus States

- Always visible focus rings (`--ring`)
- `focus-visible` for keyboard navigation

### Semantic HTML

```html
<!-- Navigation -->
<nav role="navigation" aria-label="Main">

<!-- Headings -->
<h1> → <h2> → <h3> (never skip levels)

<!-- Forms -->
<label for="input-id">Required text</label>
<input id="input-id" aria-required="true">

<!-- Tables -->
<table aria-label="Sample data">
  <thead>
    <tr>
      <th scope="col">Header</th>
    </tr>
  </thead>
</table>
```

---

## Animations

### Transitions

Standard transition duration: `150ms`

```css
/* All interactive elements */
a, button, input, select {
  transition: color 150ms, background-color 150ms, border-color 150ms;
}
```

### Loading States

```html
<!-- Loading panel component -->
<LoadingPanel>Loading data...</LoadingPanel>
```

---

## Component Library

The project uses shadcn/Base UI components. Key components:

| Component | Location | Usage |
|-----------|----------|-------|
| Button | `components/ui/button.tsx` | Actions |
| Card | `components/ui/card.tsx` | Content containers |
| Input | `components/ui/input.tsx` | Form fields |
| Table | `components/ui/table.tsx` | Data lists |
| Badge | `components/ui/badge.tsx` | Status indicators |
| Dialog | `components/ui/dialog.tsx` | Modals |
| Sheet | `components/ui/sheet.tsx` | Drawers |
| Select | `components/ui/select.tsx` | Dropdowns |
| Tabs | `components/ui/tabs.tsx` | Content switching |
| Avatar | `components/ui/avatar.tsx` | User images |

---

## Dark Mode

Dark mode is implemented via CSS custom properties with a `.dark` class on the root element. The theme toggle component (`components/theme-toggle.tsx`) handles switching.

### Dark Mode Checklist

- [ ] All colors defined in both `:root` and `.dark`
- [ ] Background uses full OKLCH values (no transparency)
- [ ] Cards/surfaces have appropriate opacity
- [ ] Charts maintain visibility

---

## Implementation Reference

### CSS Variables (globals.css)

All design tokens are defined as CSS custom properties in `src/app/globals.css`. Use these tokens rather than hardcoded values:

```css
/* ✅ Good */
color: var(--primary);
background: var(--background);
border: 1px solid var(--border);

/* ❌ Avoid */
color: #0066cc;
background: #ffffff;
```

### Tailwind Usage

```html
<!-- Using design tokens via Tailwind -->
<div class="bg-card text-foreground border-border p-4">
  Content
</div>

<!-- Surface utility -->
<div class="surface">
  Elevated content
</div>

<!-- Eyebrow text -->
<span class="eyebrow">Label</span>
```

---

## Resources

- [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Base UI](https://base-ui.com/) - Low-level primitives
- [Recharts](https://recharts.org/) - Charting library
- [React Leaflet](https://react-leaflet.js.org/) - Map components
- [OKLCH Color](https://oklch.com/) - Color space explanation
