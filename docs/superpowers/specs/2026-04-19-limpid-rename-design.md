# Limpid Rename & UI Polish Design

**Date:** 2026-04-19  
**Scope:** Rename project from "Aqua Graph"/"AquaScan" to "Limpid", standardize consistency, add subtle animations.

---

## 1. Name Replacements

All occurrences of "Aqua Graph", "AquaScan", "AQUASCAN_AI", "AquaScan_Platform_Lab" are replaced with "Limpid" variants.

| File | Location | Old | New |
|---|---|---|---|
| `frontend/src/app/layout.tsx` | metadata title | "Aqua Graph" | "Limpid" |
| `frontend/src/components/app-shell.tsx` | sidebar h1 | "Aqua Graph" | "Limpid" |
| `frontend/src/components/app-shell.tsx` | mobile sheet title | "Aqua Graph" | "Limpid" |
| `frontend/src/components/app-shell.tsx` | header eyebrow | "Microplastics Research Network" | "Limpid Network" |
| `frontend/src/app/login/login-page-client.tsx` | card title | "Sign in to Aqua Graph" | "Sign in to Limpid" |
| `frontend/src/app/page.tsx` | navbar logo | `AQUASCAN_AI.v1.0` | `limpid` (lowercase, no version suffix) |
| `frontend/src/app/page.tsx` | how-it-works heading | "The AquaScan Pipeline" | "The Limpid Pipeline" |
| `frontend/src/app/page.tsx` | footer brand | "AquaScan_Platform_Lab" | "Limpid_Platform_Lab" |
| `frontend/src/app/page.tsx` | footer copyright | "AQUASCAN_AI // BUILD: 0xB3E1" | "LIMPID // BUILD: 0xB3E1" |

The landing page navbar logo uses plain lowercase `limpid` with no version tag — intentionally minimal.

---

## 2. Consistency

The landing page (`page.tsx`) uses a separate MD3-inspired design token system (hard-coded hex colors, `font-headline`/`font-body`/`font-label` classes) while the app shell uses shadcn CSS vars. This is **intentional** — the landing page has a clinical blueprint aesthetic that differs from the app interior. No changes to either system's tokens.

No structural or layout changes are required — the existing design is consistent within each zone (landing vs. app).

---

## 3. Animations

All animations use `tw-animate-css` utilities already imported in `globals.css`. No new dependencies.

### Page content fade-in
Every app page root wrapper gets:
```
animate-in fade-in-0 slide-in-from-bottom-4 duration-300
```
Applies to: dashboard, map, samples (list + detail), devices (list + detail), admin pages.

### Login page
- Left panel: `animate-in fade-in-0 duration-500`
- Right card: `animate-in fade-in-0 duration-500 delay-150`

### KPI cards
```
hover:scale-[1.01] hover:shadow-lg transition-all duration-200
```

### Nav items (app shell)
Upgrade existing `transition-colors` to `transition-all duration-200` for smooth active indicator transitions.

### Dashboard/samples/devices cards
Standardize hover border to `hover:border-primary/50 transition-colors duration-200`.

### Landing page hero
- Hero left copy: `animate-in fade-in-0 slide-in-from-bottom-4 duration-500`
- Hero right panel: `animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-150`
- Feature cards (how-it-works): staggered `delay-100`, `delay-200`, `delay-300`, `delay-[400ms]`

### Sidebar logo icon
```
transition-transform hover:scale-110 duration-200
```

### Navbar Elements
Make sure underlining UI element is consistent for all navbar elements

---

## Constraints

- No new npm packages
- No structural/layout changes
- Landing page token system unchanged (MD3 hex colors stay as-is)
- Only Tailwind utility class additions; no new CSS rules needed
