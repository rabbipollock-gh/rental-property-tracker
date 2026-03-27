import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Tenant, Lease, MonthRecord, Property } from '../../types';

export interface TenantData {
    profile: Tenant | null;
    lease: Lease | null;
    records: MonthRecord[];
    property: Property | null;
    loading: boolean;
    error: string | null;
}

const TenantContext = createContext<TenantData>({
    profile: null,
    lease: null,
    records: [],
    property: null,
    loading: true,
    error: null
});

export const TenantProvider: React.FC<{ children: React.ReactNode, previewTenantId?: string }> = ({ children, previewTenantId }) => {
    const [data, setData] = useState<TenantData>({
        profile: null,
        lease: null,
        records: [],
        property: null,
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchContext = async () => {
            if (!supabase) return;

            try {
                let profileData;
                let profileError;

                if (previewTenantId) {
                    // Impersonation Mode: Landlords can bypass email checks and fetch their specific tenant rows
                    const { data, error } = await supabase.from('tenants').select('*').eq('id', previewTenantId).single();
                    profileData = data; profileError = error;
                } else {
                    // Native Mode: Renters must match their secure magic link email
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user?.email) throw new Error("Unauthenticated");
                    const { data, error } = await supabase.from('tenants').select('*').eq('email', user.email).single();
                    profileData = data; profileError = error;
                }

                if (profileError || !profileData) throw new Error("Tenant Profile not found.");

                // Map DB schema to Frontend Types
                const typedProfile: Tenant = {
                    id: profileData.id,
                    name: profileData.name,
                    email: profileData.email || undefined,
                    phone: profileData.phone || undefined,
                    phone2: profileData.phone2 || undefined,
                    coTenantName: profileData.co_tenant_name || undefined,
                    coTenantEmail: profileData.co_tenant_email || undefined,
                    authId: profileData.auth_id || undefined,
                    ownerId: profileData.owner_id
                };

                // 2. Fetch Active Lease
                const { data: leases } = await supabase
                    .from('leases')
                    .select('*')
                    .eq('tenant_id', profileData.id)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(1);

                const activeLease = leases?.[0];
                let typedLease: Lease | null = null;
                let typedProperty: Property | null = null;
                let typedRecords: MonthRecord[] = [];

                if (activeLease) {
                    typedLease = {
                        id: activeLease.id,
                        propertyId: activeLease.property_id,
                        tenantId: activeLease.tenant_id,
                        unitId: activeLease.unit_id || undefined,
                        monthlyRent: Number(activeLease.monthly_rent),
                        securityDeposit: Number(activeLease.security_deposit),
                        startDate: activeLease.start_date,
                        endDate: activeLease.end_date,
                        isActive: activeLease.is_active
                    };

                    // 3. Fetch Property
                    const { data: propData } = await supabase
                        .from('properties')
                        .select('*')
                        .eq('id', activeLease.property_id)
                        .single();

                    if (propData) {
                        typedProperty = {
                            id: propData.id,
                            name: propData.name,
                            address: propData.address,
                            units: propData.units || []
                        };
                    }

                    // 4. Fetch Ledgers (Month Records)
                    const { data: recordsData } = await supabase
                        .from('month_records')
                        .select('*')
                        .eq('lease_id', activeLease.id)
                        .order('year', { ascending: false })
                        .order('month', { ascending: false });

                    typedRecords = (recordsData || []).map(r => ({
                        id: r.id,
                        leaseId: r.lease_id,
                        propertyId: r.property_id,
                        year: r.year,
                        month: r.month,
                        monthlyRent: Number(r.monthly_rent),
                        dueDate: r.due_date,
                        lateFeeOverride: r.late_fee_override ? Number(r.late_fee_override) : undefined,
                        payments: r.payments || [],
                        manualFees: r.manual_fees || [],
                        adjustments: r.adjustments || [],
                        expenses: r.expenses || [],
                        notices: r.notices || []
                    }));
                }

                setData({
                    profile: typedProfile,
                    lease: typedLease,
                    property: typedProperty,
                    records: typedRecords,
                    loading: false,
                    error: null
                });

            } catch (error: any) {
                console.error("Error fetching Tenant API:", error);
                setData(prev => ({ ...prev, loading: false, error: error.message }));
            }
        };

        fetchContext();
    }, [previewTenantId]);

    return <TenantContext.Provider value={data}>{children}</TenantContext.Provider>;
};

export const useTenantData = () => useContext(TenantContext);
