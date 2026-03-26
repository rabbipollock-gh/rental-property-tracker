-- Drop the old permissive policy
DROP POLICY IF EXISTS "Enable all access for default user" ON rental_tracker_data;

-- Ensure RLS is enabled
ALTER TABLE rental_tracker_data ENABLE ROW LEVEL SECURITY;

-- Create restrictive policy based on auth
CREATE POLICY "Users can manage their own data" ON rental_tracker_data
    FOR ALL
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);
