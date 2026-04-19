# Limpid Rename & UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the project from "Aqua Graph"/"AquaScan" to "Limpid" across all pages, standardize navbar underline consistency, and add subtle Tailwind-based animations.

**Architecture:** Pure class-level changes to existing React components — no structural changes, no new files. All animations use `tw-animate-css` utilities already imported in `globals.css`. The landing page (`page.tsx`) and app shell are treated as two separate zones with independent design systems (both kept intact).

**Tech Stack:** Next.js 15, Tailwind CSS v4, `tw-animate-css`, shadcn/ui, TypeScript

---

## File Map

| File | Changes |
|---|---|
| `frontend/src/app/layout.tsx` | metadata title rename |
| `frontend/src/components/app-shell.tsx` | brand rename ×3, eyebrow rename, nav transition upgrade |
| `frontend/src/app/login/login-page-client.tsx` | card title rename, fade-in animations |
| `frontend/src/app/page.tsx` | navbar logo, pipeline heading, footer rename ×2, navbar underline consistency, hero + feature card animations |
| `frontend/src/components/dashboard/kpi-card.tsx` | hover lift |
| `frontend/src/app/(app)/dashboard/page.tsx` | page fade-in, card hover standardize |
| `frontend/src/app/(app)/map/page.tsx` | page fade-in, marker card hover standardize |
| `frontend/src/app/(app)/samples/page.tsx` | page fade-in |
| `frontend/src/app/(app)/samples/[id]/page.tsx` | page fade-in |
| `frontend/src/app/(app)/devices/page.tsx` | page fade-in |
| `frontend/src/app/(app)/devices/[id]/page.tsx` | page fade-in |
| `frontend/src/app/(app)/admin/page.tsx` | page fade-in |

---

## Task 1: Rename — layout metadata and app shell

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/components/app-shell.tsx`

- [ ] **Step 1: Update layout.tsx metadata title**

In `frontend/src/app/layout.tsx`, change:
```tsx
export const metadata: Metadata = {
  title: "Aqua Graph",
  description: "Microplastics water quality monitoring dashboard",
};
```
to:
```tsx
export const metadata: Metadata = {
  title: "Limpid",
  description: "Microplastics water quality monitoring dashboard",
};
```

- [ ] **Step 2: Update app-shell.tsx — sidebar brand, eyebrow, sheet title, nav transitions**

In `frontend/src/components/app-shell.tsx`:

Change the sidebar eyebrow + brand heading:
```tsx
// Old
<p className="eyebrow">Field Dashboard</p>
<h1 className="text-lg font-semibold">Aqua Graph</h1>
```
```tsx
// New
<p className="eyebrow">Field Dashboard</p>
<h1 className="text-lg font-semibold">Limpid</h1>
```

Change the header eyebrow:
```tsx
// Old
<p className="eyebrow">Microplastics Research Network</p>
```
```tsx
// New
<p className="eyebrow">Limpid Network</p>
```

Change the mobile sheet title:
```tsx
// Old
<SheetTitle className="text-lg font-semibold">Aqua Graph</SheetTitle>
```
```tsx
// New
<SheetTitle className="text-lg font-semibold">Limpid</SheetTitle>
```

Upgrade nav item transition from `transition-colors` to `transition-all duration-200`:
```tsx
// Old
"flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors",
```
```tsx
// New
"flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-all duration-200",
```

Add hover scale to the sidebar logo icon div:
```tsx
// Old
<div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
```
```tsx
// New
<div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-200 hover:scale-110">
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/layout.tsx frontend/src/components/app-shell.tsx
git commit -m "feat: rename to Limpid in layout and app shell"
```

---

## Task 2: Rename — login page and landing page text

**Files:**
- Modify: `frontend/src/app/login/login-page-client.tsx`
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Update login page card title**

In `frontend/src/app/login/login-page-client.tsx`, change:
```tsx
// Old
{isCognitoMode ? "Continue with AWS Cognito" : "Sign in to Aqua Graph"}
```
```tsx
// New
{isCognitoMode ? "Continue with AWS Cognito" : "Sign in to Limpid"}
```

- [ ] **Step 2: Update landing page — navbar logo**

In `frontend/src/app/page.tsx`, change:
```tsx
// Old
<div className="text-xl font-bold tracking-tight text-[#006383] uppercase font-headline">AQUASCAN_AI.v1.0</div>
```
```tsx
// New
<div className="text-xl font-bold tracking-tight text-[#006383] font-headline">limpid</div>
```

- [ ] **Step 3: Update landing page — how-it-works heading**

```tsx
// Old
<h2 className="font-headline text-3xl font-bold mb-4 text-on-surface">The AquaScan Pipeline</h2>
```
```tsx
// New
<h2 className="font-headline text-3xl font-bold mb-4 text-on-surface">The Limpid Pipeline</h2>
```

- [ ] **Step 4: Update landing page — footer brand names**

```tsx
// Old
<div className="text-lg font-bold text-primary-fixed mb-4 font-headline uppercase tracking-tighter">AquaScan_Platform_Lab</div>
```
```tsx
// New
<div className="text-lg font-bold text-primary-fixed mb-4 font-headline uppercase tracking-tighter">Limpid_Platform_Lab</div>
```

```tsx
// Old
© 2026 AQUASCAN_AI // BUILD: 0xB3E1
```
```tsx
// New
© 2026 LIMPID // BUILD: 0xB3E1
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/login/login-page-client.tsx frontend/src/app/page.tsx
git commit -m "feat: rename to Limpid in login and landing page"
```

---

## Task 3: Landing page navbar underline consistency + animations

**Files:**
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Fix navbar underline consistency**

The active nav item has `border-b border-[#006383] pb-1` but inactive items have none. Add a transparent border baseline to all inactive items so the underline appears on hover without layout shift.

Change the inactive nav links (HOW_IT_WORKS, DATA_MAP, API_DOCS):
```tsx
// Old
<a className="text-[#5c6264] hover:text-[#006383] transition-colors cursor-pointer" href="#how-it-works">HOW_IT_WORKS</a>
<a className="text-[#5c6264] hover:text-[#006383] transition-colors cursor-pointer" href="#data-map">DATA_MAP</a>
<a className="text-[#5c6264] hover:text-[#006383] transition-colors cursor-pointer" href="#">API_DOCS</a>
```
```tsx
// New
<a className="text-[#5c6264] hover:text-[#006383] border-b border-transparent pb-1 hover:border-[#006383] transition-colors cursor-pointer" href="#how-it-works">HOW_IT_WORKS</a>
<a className="text-[#5c6264] hover:text-[#006383] border-b border-transparent pb-1 hover:border-[#006383] transition-colors cursor-pointer" href="#data-map">DATA_MAP</a>
<a className="text-[#5c6264] hover:text-[#006383] border-b border-transparent pb-1 hover:border-[#006383] transition-colors cursor-pointer" href="#">API_DOCS</a>
```

- [ ] **Step 2: Add hero section animations**

Add fade-in to the hero left copy div:
```tsx
// Old
<div className="lg:col-span-6">
```
```tsx
// New
<div className="lg:col-span-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
```

Add fade-in with delay to the hero right panel:
```tsx
// Old
<div className="lg:col-span-6 relative">
```
```tsx
// New
<div className="lg:col-span-6 relative animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-150">
```

- [ ] **Step 3: Add staggered fade-in to how-it-works feature cards**

The four step cards are direct children inside the grid. Add staggered delays:
```tsx
// Step 01 card (Field Capture) — Old
<div className="bg-surface-container-lowest p-6 rounded border border-outline-variant/30 flex flex-col">
  ...Field Capture content...
```
```tsx
// Step 01 card — New
<div className="bg-surface-container-lowest p-6 rounded border border-outline-variant/30 flex flex-col animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-100">
  ...Field Capture content...
```

```tsx
// Step 02 card (Edge Inference) — Old
<div className="bg-surface-container-lowest p-6 rounded border border-outline-variant/30 flex flex-col">
  ...Edge Inference content...
```
```tsx
// Step 02 card — New
<div className="bg-surface-container-lowest p-6 rounded border border-outline-variant/30 flex flex-col animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
  ...Edge Inference content...
```

```tsx
// Step 03 card (Cloud Ingest) — Old
<div className="bg-surface-container-lowest p-6 rounded border border-outline-variant/30 flex flex-col">
  ...Cloud Ingest content...
```
```tsx
// Step 03 card — New
<div className="bg-surface-container-lowest p-6 rounded border border-outline-variant/30 flex flex-col animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
  ...Cloud Ingest content...
```

```tsx
// Step 04 card (Dashboard & Map) — Old
<div className="bg-surface-container-lowest p-6 rounded border border-outline-variant/30 flex flex-col">
  ...Dashboard content...
```
```tsx
// Step 04 card — New
<div className="bg-surface-container-lowest p-6 rounded border border-outline-variant/30 flex flex-col animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-[400ms]">
  ...Dashboard content...
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "feat: landing page navbar consistency and animations"
```

---

## Task 4: Login page animations

**Files:**
- Modify: `frontend/src/app/login/login-page-client.tsx`

- [ ] **Step 1: Add fade-in to login left panel**

```tsx
// Old
<section className="surface relative overflow-hidden rounded-[2.5rem] px-6 py-8 lg:px-10 lg:py-10">
```
```tsx
// New
<section className="surface relative overflow-hidden rounded-[2.5rem] px-6 py-8 lg:px-10 lg:py-10 animate-in fade-in-0 duration-500">
```

- [ ] **Step 2: Add delayed fade-in to login right card**

```tsx
// Old
<section className="flex items-center justify-center">
```
```tsx
// New
<section className="flex items-center justify-center animate-in fade-in-0 duration-500 delay-150">
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/login/login-page-client.tsx
git commit -m "feat: add fade-in animations to login page"
```

---

## Task 5: KPI card hover lift

**Files:**
- Modify: `frontend/src/components/dashboard/kpi-card.tsx`

- [ ] **Step 1: Add hover lift to KpiCard**

```tsx
// Old
<Card className="surface rounded-[2rem] border-0">
```
```tsx
// New
<Card className="surface rounded-[2rem] border-0 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg">
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/dashboard/kpi-card.tsx
git commit -m "feat: add hover lift to KPI cards"
```

---

## Task 6: Dashboard page — fade-in and card hover standardization

**Files:**
- Modify: `frontend/src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Add page-level fade-in**

```tsx
// Old — the outermost return div
<div className="space-y-4">
```
```tsx
// New
<div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
```

- [ ] **Step 2: Standardize recent sample card hover borders**

The recent sample link cards currently use `hover:border-primary/40`. Standardize to `hover:border-primary/50 transition-colors duration-200`:
```tsx
// Old
className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4 hover:border-primary/40"
```
```tsx
// New
className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4 hover:border-primary/50 transition-colors duration-200"
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/(app)/dashboard/page.tsx
git commit -m "feat: dashboard page fade-in and card hover consistency"
```

---

## Task 7: Map page — fade-in and marker card hover standardization

**Files:**
- Modify: `frontend/src/app/(app)/map/page.tsx`

- [ ] **Step 1: Add page-level fade-in**

```tsx
// Old
<div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
```
```tsx
// New
<div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)] animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
```

- [ ] **Step 2: Standardize marker summary card hover**

```tsx
// Old
className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4 hover:border-primary/40"
```
```tsx
// New
className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4 hover:border-primary/50 transition-colors duration-200"
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/(app)/map/page.tsx
git commit -m "feat: map page fade-in and marker card hover consistency"
```

---

## Task 8: Samples, devices, and admin pages — fade-in

**Files:**
- Modify: `frontend/src/app/(app)/samples/page.tsx`
- Modify: `frontend/src/app/(app)/samples/[id]/page.tsx`
- Modify: `frontend/src/app/(app)/devices/page.tsx`
- Modify: `frontend/src/app/(app)/devices/[id]/page.tsx`
- Modify: `frontend/src/app/(app)/admin/page.tsx`

- [ ] **Step 1: samples/page.tsx — add fade-in to the outermost return wrapper**

There are two return paths that render a `<div className="space-y-4">`. Both need the animation:
```tsx
// First return (empty state path) — Old
<div className="space-y-4">
  <Filters filters={filters} onChange={setFilters} />
  <EmptyState .../>
</div>
```
```tsx
// First return — New
<div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
  <Filters filters={filters} onChange={setFilters} />
  <EmptyState .../>
</div>
```

```tsx
// Second return (main content path) — Old
<div className="space-y-4">
  <Filters .../>
  <Card ...>
```
```tsx
// Second return — New
<div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
  <Filters .../>
  <Card ...>
```

- [ ] **Step 2: Read and add fade-in to samples/[id]/page.tsx**

Read the file first, then add `animate-in fade-in-0 slide-in-from-bottom-4 duration-300` to the outermost non-loading, non-error return `<div>` or `<section>`.

- [ ] **Step 3: Read and add fade-in to devices/page.tsx**

Read the file first, then add `animate-in fade-in-0 slide-in-from-bottom-4 duration-300` to the outermost non-loading, non-error return `<div>`.

- [ ] **Step 4: Read and add fade-in to devices/[id]/page.tsx**

Read the file first, then add `animate-in fade-in-0 slide-in-from-bottom-4 duration-300` to the outermost non-loading, non-error return `<div>`.

- [ ] **Step 5: Read and add fade-in to admin/page.tsx**

Read the file first, then add `animate-in fade-in-0 slide-in-from-bottom-4 duration-300` to the outermost non-loading, non-error return `<div>`.

- [ ] **Step 6: Commit**

```bash
git add \
  frontend/src/app/\(app\)/samples/page.tsx \
  "frontend/src/app/(app)/samples/[id]/page.tsx" \
  frontend/src/app/\(app\)/devices/page.tsx \
  "frontend/src/app/(app)/devices/[id]/page.tsx" \
  frontend/src/app/\(app\)/admin/page.tsx
git commit -m "feat: add page fade-in to samples, devices, and admin"
```

---

## Visual Verification

After all tasks complete, start the dev server:

```bash
cd frontend && npm run dev
```

Check each of the following:
- [ ] Landing page navbar shows `limpid` (lowercase, no version tag)
- [ ] Inactive navbar links show underline on hover, no layout shift
- [ ] Hero section fades in from bottom on load
- [ ] How-it-works cards animate in with visible stagger (delay differences perceptible)
- [ ] Login page: left panel fades in, right card appears ~150ms later
- [ ] App shell sidebar shows "Limpid" brand name
- [ ] App shell header eyebrow reads "Limpid Network"
- [ ] Mobile sheet (hamburger menu) shows "Limpid"
- [ ] KPI cards lift slightly on hover
- [ ] Dashboard/map/samples/devices/admin pages fade in on navigation
- [ ] Sample and marker cards show consistent `hover:border-primary/50` effect
- [ ] Footer reads "Limpid_Platform_Lab" and "© 2026 LIMPID"
