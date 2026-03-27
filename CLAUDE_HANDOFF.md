# 🤝 Project Handoff: PropTrack AI (Rental Management)

This file serves as a comprehensive "context dump" for **Claude Code** (or any future AI agent) to take over this project seamlessly.

## 🚀 Project Overview
PropTrack AI is a full-stack rental property management application. It has evolved from a simple LocalStorage prototype into an enterprise-ready platform with a normalized relational database.

### 🛠 Tech Stack
- **Frontend**: React 18, TypeScript, Vite.
- **Styling**: Tailwind CSS, Lucide Icons.
- **State Management**: **Zustand** (custom store coordinating domain hooks).
- **Backend/DB**: **Supabase** (Auth, PostgreSQL, Row Level Security).
- **Charts**: Recharts.
- **Testing**: Vitest (Logic verification for late fees).

---

## 🏗 Current Architecture

### 1. Data Layer (Supabase)
The app has migrated from a single JSON blob to a normalized relational schema.
- **Key Tables**: `properties`, `units`, `tenants`, `leases`, `month_records`, `property_expenses`, `documents`.
- **Location**: See [supabaseService.ts](file:///Users/rebbi/Desktop/rental-property-tracker/services/supabaseService.ts) for the mapping and persistence logic.
- **Auth**: Integrated using Supabase Auth. RBAC (Landlord vs. Tenant) is handled in [useUserRole.ts](file:///Users/rebbi/Desktop/rental-property-tracker/hooks/useUserRole.ts).

### 2. State Management (Zustand)
The core store [useStore.ts](file:///Users/rebbi/Desktop/rental-property-tracker/hooks/useStore.ts) coordinates several "Domain Hooks" to keep logic modular:
- `usePortfolio`: Handles CRUD for Properties, Tenants, and Leases.
- `useMonthRecords`: Manages the rental ledger (payments, fees, etc.).
- `useVault`: Manages document logic.
- `usePropertyExpenses`: Manages non-tenant-specific property costs.

### 3. Business Logic
- **Late Fee Calculation**: Critical financial logic lives in [calculations.ts](file:///Users/rebbi/Desktop/rental-property-tracker/utils/calculations.ts). 
  - *Logic*: 10% flat fee on unpaid rent + $5/day cumulative after the due date.
  - *Testing*: Verified by `vitest` in `calculations.test.ts`.

---

## 📂 Key Directories
- `/hooks/domain`: Modular business logic.
- `/services`: Supabase client, persistence logic, and CSV import service.
- `/pages/tenant`: The "Tenant Portal" side of the app.
- `/components`: Shared UI components (Modals, Layouts, etc.).

### 4. Edge Functions & Email
- **Service**: [sharePDF.ts](file:///Users/rebbi/Desktop/rental-property-tracker/utils/sharePDF.ts).
- **Function**: Invokes a Supabase Edge Function named `send-report-email`.
- **Logic**: Converts HTML components to PDF (Base64) and sends them via a landlord's Gmail account (requires Gmail App Password in Settings).

---

## 📝 Recent Progress & "Secret Sauce"
- **Landlord Dashboard**: Now features a dynamic Recharts financial overview.
- **Tenant Portal**: Implemented a separate PWA-style route structure for tenants to see their own data.
- **Impersonation**: Landlords can "preview" the tenant experience via `/preview/:tenantId`.
- **Relational Sync**: The app performs a strict sequential sync to respect Postgres Foreign Key constraints.

---

## 🔮 Next Steps for Claude
1. **Maintenance System**: The `Maintenance.tsx` page is partially built but needs a full ticket tracking system linked to the `documents` vault.
2. **Email Automation**: The settings allow saving a Gmail App Password, but the actual invitation/reminder email logic isn't wired up yet.
3. **PWA Support**: Finalize the manifest.json and service worker for the Tenant Portal to be "installable."
4. **Migrations**: Check the `supabase/migrations` folder for the latest DB schema updates.

---

## 🛠 Setup Instructions for Claude
1. Ensure `.env` contains:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Run `npm install`.
3. Run `npm run dev` to start the landlord dashboard at `localhost:5173`.
4. Run `npx vitest` to ensure financial logic remains unbroken during edits.

---
*Signed, Antigravity (Google DeepMind AI)*
