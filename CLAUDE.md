# CLAUDE.md — AI Assistant Guide for QLHV

This file provides context for AI assistants (Claude, Copilot, etc.) working in this repository.

---

## Project Overview

**QLHV** is a Student Management System for a Math Center (Quản Lý Học Viên). It is a Vietnamese-language web application for managing student enrollment, class schedules, attendance, tuition fees, promotions/discounts, announcements, and data backups.

**Deployed at:** Vercel (see `DEPLOY.md` for setup instructions)  
**Database:** Supabase (PostgreSQL with Row Level Security)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18.2.0 |
| Build Tool | Vite 5.1.6 |
| Routing | React Router DOM 7.13.1 |
| Database/API | Supabase JS 2.91.0 |
| UI Icons | Lucide React 0.344.0 |
| Animations | Framer Motion 11.0.0 |
| Charts | Recharts 2.12.0 |
| Excel I/O | XLSX 0.18.5 |
| Styling | Vanilla CSS (no framework) |
| Linting | ESLint 8.57.0 |

---

## Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Production build → /dist
npm run preview    # Preview production build locally
npm run lint       # Run ESLint (max-warnings: 0)
```

There are **no automated tests** in this project. Verify changes manually in the browser.

---

## Environment Variables

Create a `.env.local` file (never commit it) with:

```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

These are loaded via `src/lib/supabase.js`. In production, set them in the Vercel dashboard.

---

## Directory Structure

```
src/
├── components/          # Reusable UI components (modals, sidebar, login, toast)
├── views/               # Page-level components (one per route)
├── services/            # All Supabase/data logic — one file per domain
├── hooks/
│   └── useDatabase.js   # Central state management hook (~1000 lines)
├── contexts/
│   └── NotificationContext.jsx  # Toast + confirm modal system
├── lib/
│   └── supabase.js      # Supabase client initialization
├── data/
│   └── mockData.js      # Sample data for development/testing
├── App.jsx              # Root component with router
├── main.jsx             # React entry point
├── App.css              # App layout styles
└── index.css            # Global CSS variables & base styles

schema.sql               # Full PostgreSQL schema (run in Supabase SQL editor)
vercel.json              # SPA rewrite rule for Vercel deployment
DEPLOY.md                # Deployment instructions
```

---

## Architecture & Data Flow

This app uses a **service layer pattern**:

```
View (JSX) → useDatabase hook → Service (Supabase query) → Supabase DB
```

1. Views call `db.actions.*()` or `db.views.*()` from the `useDatabase` hook
2. The hook delegates to domain-specific service files
3. Services execute Supabase queries and return plain JS objects
4. Results are stored in hook state and views re-render

**Never call Supabase directly from a view component.** Always go through a service.

---

## Key Files

| File | Purpose |
|---|---|
| `src/hooks/useDatabase.js` | Central state: all data arrays, fetch logic, CRUD actions, calculations |
| `src/lib/supabase.js` | Supabase client with RLS secret header |
| `src/App.jsx` | Route definitions and auth guard |
| `src/contexts/NotificationContext.jsx` | `useNotification()` hook for toasts and confirm dialogs |
| `schema.sql` | Database schema (PostgreSQL) |

---

## Database Schema (Supabase)

| Table | Key Columns |
|---|---|
| `classes` | id (text), name, category, schedule (JSONB), fee_per_session |
| `students` | id (text), name, birth_year, phone, enroll_date, leave_date, class_id, status, status_history (JSONB), discount_rate |
| `fees` | id (text), student_id, amount, date, method, note |
| `extra_attendance` | id (text), student_id, date, status, fee, is_recurring, recurring_pattern (JSONB), change_history (JSONB) |
| `holidays` | id (text), date, end_date, description, type, class_id, student_id |
| `promotions` | id (bigint), class_id, month (YYYY-MM), discount_rate/discount_amount, discount_type, excluded_student_ids (JSONB) |
| `student_promotions` | id (bigint), student_id, month (YYYY-MM), discount_rate/discount_amount, discount_type |
| `messages` | id (bigint), author, content, created_at |
| `backups` | id (bigint), data (JSONB), filename, created_at |

**RLS Security:** All write operations require the header `x-app-secret: cqt263`, set in `src/lib/supabase.js`.

---

## State Management

All application state lives in `src/hooks/useDatabase.js`. It exposes:

- **State arrays:** `students`, `classes`, `extraAttendance`, `fees`, `holidays`, `promotions`, `studentPromotions`, `messages`, `automatedBackups`, `isLoading`
- **`db.actions.*`** — CRUD operations (addStudent, updateClass, deleteFee, etc.)
- **`db.views.*`** — Computed/derived data for specific views
- **Utility functions:** `getClass()`, `getLocalDateString()`, `countSessionsInRange()`, `getStudentTuitionDetails()`

---

## Authentication

- Simple localStorage flag: `hv_manager_auth`
- 10-minute idle timeout (auto-logout on inactivity)
- Login credentials are checked in `src/components/Login.jsx`
- **No JWT or session tokens** — this is a simple single-user app

---

## Notification System

**Never use `alert()`, `confirm()`, or `window.prompt()`.**

Use the `useNotification()` hook from `NotificationContext`:

```jsx
const { showToast, showConfirm } = useNotification();

// Toast (auto-dismisses)
showToast('Lưu thành công!', 'success');  // types: success | error | warning | info

// Confirmation dialog
const ok = await showConfirm('Bạn có chắc muốn xóa?');
if (ok) { /* proceed */ }
```

---

## Styling Conventions

- **No CSS framework** — pure vanilla CSS
- **CSS variables** defined in `src/index.css` (`:root`), use them everywhere:
  - Colors: `--primary`, `--secondary`, `--accent`, `--success`, `--warning`, `--danger`
  - Layout: `--radius` (16px), `--shadow`, `--card-bg`, `--bg-dark`
  - Fonts: `--font-main` (Inter), `--font-display` (Outfit)
- **Glass morphism** cards use the `.glass` class (backdrop-filter blur)
- **Responsive breakpoints:** 1200px (tablet), 640px (mobile)
- Component styles are co-located with component files or in `App.css`

---

## Code Conventions

### Naming
- **Components:** PascalCase files & functions (`AddStudentModal.jsx`)
- **Services/hooks/utils:** camelCase files & functions (`studentService.js`)
- **Constants:** UPPER_SNAKE_CASE (`TIMEOUT_MS`)
- **CSS classes:** kebab-case (`student-card`, `glass-modal`)

### Component Structure
- One component per file
- Modal components follow the pattern: receive `isOpen`, `onClose`, `onSave` + data props
- Views receive the `db` object from `useDatabase` as a prop

### Dates
- Always use **local date strings** in `YYYY-MM-DD` format (not ISO UTC) to avoid timezone bugs
- Use `db.getLocalDateString(date)` for formatting
- Months stored as `YYYY-MM` strings (e.g., `"2024-03"`)

### Vietnamese Language
- All UI text, labels, status values, and messages are in Vietnamese
- Student statuses: `'Mới nhập học'` → `'Đang học'` → `'Đã nghỉ'`
- Holiday types: `'Nghỉ Lễ'` (public holiday) or `'Nghỉ đột xuất'` (unexpected break)
- Discount types: `'percent'` or `'amount'` (VNĐ fixed amount)

---

## Tuition Calculation Logic

When calculating a student's monthly fee (in `useDatabase.js`):

1. Count scheduled sessions in the month × `fee_per_session`
2. Add any extra session fees
3. Apply **student's personal discount rate** (percentage, stored on student record)
4. Apply **class-level promotion** for that month (percent or fixed VNĐ amount), unless the student is in `excluded_student_ids`
5. Apply **individual student promotion** for that month

---

## Backup System

- Auto-backup triggers **every Monday** (checked on app load)
- Backups older than **28 days** are auto-deleted
- Backup data = JSON export of all tables (except `backups` itself)
- Manual backup/restore available in the **Settings** view
- Service: `src/services/backupService.js`

---

## Adding New Features — Checklist

1. **Database change?** Update `schema.sql` and run the SQL in Supabase dashboard
2. **New data entity?** Create `src/services/newEntityService.js` with CRUD functions
3. **New state?** Add state + fetch + actions to `src/hooks/useDatabase.js`
4. **New page?** Create `src/views/NewView.jsx`, add a route in `src/App.jsx`, add nav link in `src/components/Sidebar.jsx`
5. **New modal?** Follow the existing modal pattern (isOpen/onClose/onSave props)
6. **Notifications?** Use `useNotification()` — never native browser dialogs
7. **Styles?** Use existing CSS variables; add new styles to the component file or `App.css`

---

## What NOT to Do

- Do not call Supabase from view components — always use the service layer
- Do not use `alert()`, `confirm()`, or `prompt()` — use `useNotification()`
- Do not hardcode colors — use CSS variables from `index.css`
- Do not add Redux, Zustand, or other state libraries — the `useDatabase` hook is the pattern
- Do not commit `.env` files or expose Supabase credentials
- Do not use UTC dates for display — use local date strings
- Do not add new npm packages without considering bundle size impact

---

## Deployment

1. Push to `main` branch → Vercel auto-deploys
2. Set env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel dashboard
3. Database schema: run `schema.sql` in the Supabase SQL Editor for new projects
4. The `vercel.json` SPA rewrite ensures client-side routes (e.g. `/students`) don't 404 on refresh

See `DEPLOY.md` for full deployment walkthrough.
