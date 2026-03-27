import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export type UserRole = 'landlord' | 'tenant' | null | 'loading';

export const useUserRole = () => {
    const [role, setRole] = useState<UserRole>('loading');

    useEffect(() => {
        const checkRole = async () => {
            if (!supabase) {
                setRole(null);
                return;
            }
            
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                setRole(null);
                return;
            }

            // A user is a Tenant if they exist in the tenants table with this email
            const { data: tenant } = await supabase
                .from('tenants')
                .select('id')
                .eq('email', user.email)
                .maybeSingle();
                
            if (tenant) {
                setRole('tenant');
                return;
            }

            // Otherwise, they are a landlord (either legacy, or a brand new sign-up)
            setRole('landlord'); 
        };
        
        checkRole();

        // Listen for auth changes to re-evaluate role
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setRole(null);
            } else {
                setRole('loading');
                checkRole();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return role;
};
