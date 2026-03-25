# Rental Property Management App (PropTrack AI)

A robust, full-stack application for landlords to manage properties, track tenant payments, and automate financial reporting.

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **State Management**: Zustand (Local Storage persistence)
- **Routing**: React Router DOM (HashRouter)
- **Styling**: Vanilla CSS / Modules
- **Icons**: Lucide React
- **Charts**: Recharts
- **Utilities**: date-fns (Date manipulation), PapaParse (CSV Import), html2pdf.js (PDF Generation)

## ✨ Current Features

- **Dashboard**: High-level overview of property financials and status.
- **Property Management**: Track landlord and tenant details, lease terms, and security deposits.
- **Financial Tracking**: 
  - Monthly rent records.
  - Granular tracking of Payments, Fees, Adjustments, and Expenses.
  - Automated Late Fee calculations (10% flat fee + $5/day).
- **Tenant Communications**: Track notices (e.g., Pay or Quit) and generate print-friendly PDF statements.
- **Reports**: Visual insights into income and expenses.
- **Data Portability**: CSV import functionality for historical data.
- **Error Logging**: Built-in error tracking for debugging.

## 🛠️ Project Structure (In-Progress Refactor)

```
/src
  /components     # Reusable UI components
  /hooks          # Domain hooks (managed state & logic)
  /pages          # Main view components
  /utils          # Calculation logic and helper functions
  /types.ts       # Global TypeScript interfaces
  /constants.ts   # Configuration and static data
```

## 📝 Setup

1. `npm install`
2. `npm run dev`

## 🚀 Roadmap (Stage 2 / 3)
- **Multi-Property Support**: Transition the app to handle a database of multiple properties and tenants, rather than a single global settings object.
- **Supabase Authentication**: Implement a secure Login/Registration system (Email & Password).
- **True Storage Security**: Once Authentication is built, transition the `receipts` bucket from Public to Private, and update the app to generate securely signed, temporary URLs for viewing receipts and leases.
