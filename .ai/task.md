# Phase 12: Tenant Portal UI & Routing

With the backend fully relational and multi-tenant ready, we can now build the Mobile-First Progressive Web App for the renters.

- [x] 1. **Role-Based Routing**: Update `App.tsx` to distinguish between `landlord` and `tenant` user roles upon authentication.
- [x] 2. **Tenant PWA Layout**: Build `<TenantLayout />` featuring a mobile-friendly Bottom-Tab navigation (Home, Repairs, Documents, Pay).
- [x] 3. **Tenant Dashboard**: Create an `Account Summary` component showing the tenant's current balance, next rent due date, and a read-only history of their ledger.
- [x] 4. **Maintenance Tracker**: Build a repair request form with a visual "Status Timeline" (Open -> In Progress -> Scheduled -> Resolved).
- [x] 5. **Document Vault (Read-Only)**: Create a filtered documents view allowing tenants to see their active lease agreements.
- [x] 6. **Landlord Backend Controls**: Add an "Invite to Portal" button inside the landlord's `TenantsTab` to securely provision Magic Link access for their renters.
- [x] 7. **Supabase RLS Implementation**: Deploy secure database policies ensuring tenants can exclusively read rows matching their `tenantId`.
