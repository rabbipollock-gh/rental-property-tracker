-- ==========================================
-- PHASE 14: RELATIONAL SAAS MULTI-TENANT MIGRATION
-- Copy this entire file and run it directly in your Supabase SQL Editor.
-- ==========================================

-- 1. Create Settings (The Global Configuration per Landlord)
CREATE TABLE IF NOT EXISTS settings (
    owner_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    landlord_name TEXT DEFAULT '',
    landlord_address TEXT DEFAULT '',
    landlord_email TEXT DEFAULT '',
    landlord_phone TEXT DEFAULT '',
    gmail_app_password TEXT DEFAULT '',
    saved_contacts JSONB DEFAULT '[]'::jsonb,
    fee_categories JSONB DEFAULT '[]'::jsonb,
    expense_categories JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Properties
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    units JSONB DEFAULT '[]'::jsonb, -- Array of { id, name }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    co_tenant_name TEXT,
    co_tenant_email TEXT,
    phone TEXT,
    phone2 TEXT,
    auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Maps to actual portal user
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Leases
CREATE TABLE IF NOT EXISTS leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    monthly_rent NUMERIC DEFAULT 0,
    security_deposit NUMERIC DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Month_Records (The Ledgers)
CREATE TABLE IF NOT EXISTS month_records (
    id TEXT PRIMARY KEY, -- Format: YYYY-MM_propId
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    monthly_rent NUMERIC DEFAULT 0,
    due_date DATE NOT NULL,
    late_fee_override NUMERIC,
    payments JSONB DEFAULT '[]'::jsonb,
    manual_fees JSONB DEFAULT '[]'::jsonb,
    adjustments JSONB DEFAULT '[]'::jsonb,
    expenses JSONB DEFAULT '[]'::jsonb,
    notices JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Global Property Expenses (Tethered to a Property, not a Lease)
CREATE TABLE IF NOT EXISTS property_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC DEFAULT 0,
    category TEXT NOT NULL,
    description TEXT,
    vendor TEXT,
    receipt_url TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_interval TEXT,
    is_split BOOLEAN DEFAULT false,
    splits JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Documents Vault
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    month_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    date_added TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) ENABLEMENT
-- Guarantees SaaS isolation between landlords
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE month_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create Policies to strictly restrict reads/writes to the owner's auth token
CREATE POLICY "Strict Isolation - Settings" ON settings FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Strict Isolation - Properties" ON properties FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Strict Isolation - Tenants" ON tenants FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Strict Isolation - Leases" ON leases FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Strict Isolation - Month Records" ON month_records FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Strict Isolation - Expenses" ON property_expenses FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Strict Isolation - Documents" ON documents FOR ALL USING (auth.uid() = owner_id);

-- Legacy Table (If existing, clean up data for sync script)
-- Do not delete rental_tracker_data quite yet until the React sync script runs!

-- ==========================================
-- TENANT PORTAL RLS POLICIES (Phase 12)
-- Allows renters to read data explicitly linked to them
-- ==========================================

-- 1. Tenant can read their own profile via their Authenticated Email
CREATE POLICY "Tenant Profile Access" ON tenants FOR SELECT USING (email = (select auth.jwt()->>'email'));

-- 2. Tenant can read leases they are signed on
CREATE POLICY "Tenant Lease Access" ON leases FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE email = (select auth.jwt()->>'email')));

-- 3. Tenant can read ledgers (Month Records) linked to their active lease
CREATE POLICY "Tenant Ledger Access" ON month_records FOR SELECT USING (lease_id IN (SELECT id FROM leases WHERE tenant_id IN (SELECT id FROM tenants WHERE email = (select auth.jwt()->>'email'))));

-- 4. Tenant can read the specific Property they are assigned to
CREATE POLICY "Tenant Property Access" ON properties FOR SELECT USING (id IN (SELECT property_id FROM leases WHERE tenant_id IN (SELECT id FROM tenants WHERE email = (select auth.jwt()->>'email'))));

-- 5. Tenant can read Documents explicitly shared with their tenant_id
CREATE POLICY "Tenant Document Access" ON documents FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE email = (select auth.jwt()->>'email')));
