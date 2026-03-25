-- Create the main table for rental data
CREATE TABLE IF NOT EXISTS rental_tracker_data (
    user_id TEXT PRIMARY KEY,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE rental_tracker_data ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to see/edit only their own data
-- Note: This assumes you use Supabase Auth later. For now, it's a simple permissive policy.
CREATE POLICY "Enable all access for default user" ON rental_tracker_data
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_rental_tracker_data_content ON rental_tracker_data USING GIN (content);
