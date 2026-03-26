import { AppData, Property, Tenant, Lease, Unit } from '../../types';

export const usePortfolio = (
  data: Pick<AppData, 'properties' | 'tenants' | 'leases'>,
  setData: (data: Partial<AppData>) => void
) => {
  const properties = data.properties || [];
  const tenants = data.tenants || [];
  const leases = data.leases || [];

  // --- PROPERTIES & UNITS ---
  const addProperty = (property: Property) => {
    setData({ properties: [...properties, property] });
  };
  const updateProperty = (property: Property) => {
    setData({ properties: properties.map(p => p.id === property.id ? property : p) });
  };
  const deleteProperty = (propertyId: string) => {
    setData({ properties: properties.filter(p => p.id !== propertyId) });
  };
  
  const addUnitToProperty = (propertyId: string, unit: Unit) => {
    setData({
      properties: properties.map(p => 
        p.id === propertyId ? { ...p, units: [...p.units, unit] } : p
      )
    });
  };
  const updateUnit = (propertyId: string, unit: Unit) => {
    setData({
      properties: properties.map(p => 
        p.id === propertyId ? { 
          ...p, 
          units: p.units.map(u => u.id === unit.id ? unit : u) 
        } : p
      )
    });
  };
  const deleteUnit = (propertyId: string, unitId: string) => {
    setData({
      properties: properties.map(p => 
        p.id === propertyId ? { 
          ...p, 
          units: p.units.filter(u => u.id !== unitId) 
        } : p
      )
    });
  };

  // --- TENANTS ---
  const addTenant = (tenant: Tenant) => {
    setData({ tenants: [...tenants, tenant] });
  };
  const updateTenant = (tenant: Tenant) => {
    setData({ tenants: tenants.map(t => t.id === tenant.id ? tenant : t) });
  };
  const deleteTenant = (tenantId: string) => {
    setData({ tenants: tenants.filter(t => t.id !== tenantId) });
  };

  // --- LEASES ---
  const addLease = (lease: Lease) => {
    setData({ leases: [...leases, lease] });
  };
  const updateLease = (lease: Lease) => {
    setData({ leases: leases.map(l => l.id === lease.id ? lease : l) });
  };
  const deleteLease = (leaseId: string) => {
    setData({ leases: leases.filter(l => l.id !== leaseId) });
  };

  return {
    properties, addProperty, updateProperty, deleteProperty,
    addUnitToProperty, updateUnit, deleteUnit,
    tenants, addTenant, updateTenant, deleteTenant,
    leases, addLease, updateLease, deleteLease
  };
};
