import { supabase } from './supabaseClient';
import { AppData, MonthRecord, Property, Tenant, Lease, Expense, DocumentItem, PropertySettings } from '../types';

export const fetchAppData = async (): Promise<AppData | null> => {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Concurrently fetch all relational tables
    const [
        { data: settings },
        { data: properties },
        { data: tenants },
        { data: leases },
        { data: records },
        { data: expenses },
        { data: documents }
    ] = await Promise.all([
        supabase.from('settings').select('*').eq('owner_id', user.id).single(),
        supabase.from('properties').select('*').eq('owner_id', user.id),
        supabase.from('tenants').select('*').eq('owner_id', user.id),
        supabase.from('leases').select('*').eq('owner_id', user.id),
        supabase.from('month_records').select('*').eq('owner_id', user.id),
        supabase.from('property_expenses').select('*').eq('owner_id', user.id),
        supabase.from('documents').select('*').eq('owner_id', user.id)
    ]);

    if (!settings && !properties?.length) {
        return null; // First time user or legacy user who hasn't run the migration
    }

    // Transform DB snake_case back to React camelCase (assuming types map cleanly for simple things, but we strictly map complex ones)
    return {
        settings: settings ? {
            ...settings,
            landlordName: settings.landlord_name,
            landlordAddress: settings.landlord_address,
            landlordEmail: settings.landlord_email,
            landlordPhone: settings.landlord_phone,
            gmailAppPassword: settings.gmail_app_password,
            savedContacts: settings.saved_contacts,
            feeCategories: settings.fee_categories,
            expenseCategories: settings.expense_categories
        } as PropertySettings : {} as PropertySettings,
        properties: properties as Property[] || [],
        tenants: (tenants || []).map(t => ({
            id: t.id,
            name: t.name,
            email: t.email,
            coTenantName: t.co_tenant_name,
            coTenantEmail: t.co_tenant_email,
            phone: t.phone,
            phone2: t.phone2
        })) as Tenant[],
        leases: (leases || []).map(l => ({
            id: l.id,
            propertyId: l.property_id,
            unitId: l.unit_id,
            tenantId: l.tenant_id,
            monthlyRent: Number(l.monthly_rent),
            securityDeposit: Number(l.security_deposit),
            startDate: l.start_date,
            endDate: l.end_date,
            isActive: l.is_active
        })) as Lease[],
        records: (records || []).map(r => ({
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
        })) as MonthRecord[],
        propertyExpenses: (expenses || []).map(e => ({
            id: e.id,
            propertyId: e.property_id,
            date: e.date,
            amount: Number(e.amount),
            category: e.category,
            description: e.description,
            vendor: e.vendor,
            receiptUrl: e.receipt_url,
            isRecurring: e.is_recurring,
            recurringInterval: e.recurring_interval,
            isSplit: e.is_split,
            splits: e.splits || []
        })) as Expense[],
        documents: (documents || []).map(d => ({
            id: d.id,
            name: d.name,
            type: d.type,
            url: d.url,
            dateAdded: d.date_added,
            propertyId: d.property_id,
            tenantId: d.tenant_id,
            monthId: d.month_id
        })) as DocumentItem[]
    };
};

export const saveAppData = async (data: AppData): Promise<boolean> => {
    if (!supabase) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
        // 1. Settings (Single Row Upsert)
        if (data.settings) {
            await supabase.from('settings').upsert({
                owner_id: user.id,
                landlord_name: data.settings.landlordName || '',
                landlord_address: data.settings.landlordAddress || '',
                landlord_email: data.settings.landlordEmail || '',
                landlord_phone: data.settings.landlordPhone || '',
                gmail_app_password: data.settings.gmailAppPassword || '',
                saved_contacts: data.settings.savedContacts || [],
                fee_categories: data.settings.feeCategories || [],
                expense_categories: data.settings.expenseCategories || [],
                updated_at: new Date().toISOString()
            });
        }

        // Helper to Sync Lists (Upserts items & Deletes orphaned items)
        const syncTable = async (tableName: string, items: any[], mapFn: (item: any) => any) => {
            if (!items) return;
            const mapped = items.map(mapFn);
            if (mapped.length > 0) {
                await supabase.from(tableName).upsert(mapped);
            }
            // Delete what no longer exists in local state
            const currentIds = items.map(i => i.id);
            const query = supabase.from(tableName).delete().eq('owner_id', user.id);
            if (currentIds.length > 0) {
                await query.not('id', 'in', `(${currentIds.map(id => `"${id}"`).join(',')})`);
            } else {
                await query; // If array is empty, delete all rows for this owner
            }
        };

        // STRICT SEQUENTIAL SYNC to respect PostgreSQL Foreign Key Constraints!
        // 1. Core Definitions (No foreign keys)
        await syncTable('properties', data.properties || [], p => ({
            id: p.id, owner_id: user.id, name: p.name, address: p.address, units: p.units || []
        }));
        await syncTable('tenants', data.tenants || [], t => ({
            id: t.id, owner_id: user.id, name: t.name, email: t.email || '', co_tenant_name: t.coTenantName || '', co_tenant_email: t.coTenantEmail || '', phone: t.phone || '', phone2: t.phone2 || ''
        }));
        
        // 2. Leases (Depends on properties and tenants)
        await syncTable('leases', data.leases || [], l => ({
            id: l.id, owner_id: user.id, property_id: l.propertyId, unit_id: l.unitId, tenant_id: l.tenantId, monthly_rent: l.monthlyRent, security_deposit: l.securityDeposit, start_date: l.startDate, end_date: l.endDate, is_active: l.isActive
        }));

        // 3. Ledgers and Expenses (Depends on Leases and Properties)
        await syncTable('month_records', data.records || [], r => ({
            id: r.id, owner_id: user.id, lease_id: r.leaseId, property_id: r.propertyId, year: r.year, month: r.month, monthly_rent: r.monthlyRent, due_date: r.dueDate, late_fee_override: r.lateFeeOverride, payments: r.payments || [], manual_fees: r.manualFees || [], adjustments: r.adjustments || [], expenses: r.expenses || [], notices: r.notices || [], updated_at: new Date().toISOString()
        }));
        await syncTable('property_expenses', data.propertyExpenses || [], e => ({
            id: e.id, owner_id: user.id, property_id: e.propertyId, date: e.date, amount: e.amount, category: e.category, description: e.description, vendor: e.vendor, receipt_url: e.receiptUrl, is_recurring: e.isRecurring, recurring_interval: e.recurringInterval, is_split: e.isSplit, splits: e.splits || []
        }));

        // 4. Documents Vault
        await syncTable('documents', data.documents || [], d => ({
            id: d.id, owner_id: user.id, property_id: d.propertyId, tenant_id: d.tenantId, month_id: d.monthId, name: d.name, type: d.type, url: d.url, date_added: d.dateAdded || new Date().toISOString()
        }));

        return true;
    } catch (e) {
        console.error('Supabase save error:', e);
        return false;
    }
};

export const checkLegacyBlobData = async (): Promise<AppData | null> => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('rental_tracker_data').select('content').eq('user_id', user.id).single();
    return data?.content as AppData || null;
};
