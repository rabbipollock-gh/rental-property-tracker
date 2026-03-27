-- ==========================================
-- PHASE 12: TENANT MAINTENANCE TRACKER
-- ==========================================

CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Plumbing', 'Electrical', 'HVAC', 'Appliance', 'Structural', 'Other')),
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Scheduled', 'Resolved')),
    priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Emergency')),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: In a real system you would add an update trigger for updated_at
-- Enable Row Level Security
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;

-- Landlord Policy: Read/Write if owner_id matches
CREATE POLICY "Landlord Maintenance Access" ON maintenance_tickets FOR ALL USING (auth.uid() = owner_id);

-- Tenant Policy: Read/Create if tenant_id matches their email identity
CREATE POLICY "Tenant Maintenance Read" ON maintenance_tickets FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE email = (select auth.jwt()->>'email'))
);

CREATE POLICY "Tenant Maintenance Insert" ON maintenance_tickets FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE email = (select auth.jwt()->>'email'))
);
