import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Building, Users, FileSignature, Plus, Edit2, Trash2, Home, UserPlus, MapPin } from 'lucide-react';
import { Property, Tenant, Lease, Unit } from '../types';

type Tab = 'properties' | 'tenants' | 'leases';

export const Properties: React.FC = () => {
  const { properties, tenants, leases, addProperty, updateProperty, deleteProperty, addTenant, updateTenant, deleteTenant, addLease, updateLease, deleteLease } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('properties');

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-2 md:p-6 pb-24">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Portfolio Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your buildings, tenants, and active lease contracts.</p>
            </div>
       </div>

       {/* Tabs */}
       <div className="border-b border-gray-200">
         <nav className="-mb-px flex space-x-8">
           <button
             onClick={() => setActiveTab('properties')}
             className={`${activeTab === 'properties' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
           >
             <Building className="mr-2" size={18} />
             Properties & Units
           </button>
           <button
             onClick={() => setActiveTab('tenants')}
             className={`${activeTab === 'tenants' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
           >
             <Users className="mr-2" size={18} />
             Tenants
           </button>
           <button
             onClick={() => setActiveTab('leases')}
             className={`${activeTab === 'leases' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
           >
             <FileSignature className="mr-2" size={18} />
             Active Leases
           </button>
         </nav>
       </div>

       {/* Tab Content */}
       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">
          {activeTab === 'properties' && <PropertiesTab properties={properties || []} leases={leases || []} tenants={tenants || []} onAdd={addProperty} onUpdate={updateProperty} onDelete={deleteProperty} />}
          {activeTab === 'tenants' && <TenantsTab tenants={tenants || []} leases={leases || []} properties={properties || []} onAdd={addTenant} onUpdate={updateTenant} onDelete={deleteTenant} />}
          {activeTab === 'leases' && <LeasesTab leases={leases || []} properties={properties || []} tenants={tenants || []} onAdd={addLease} onUpdate={updateLease} onDelete={deleteLease} />}
       </div>
    </div>
  );
};

// --- PROPERTIES TAB ---
const PropertiesTab = ({ properties, leases, tenants, onAdd, onUpdate, onDelete }: any) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Property>>({});

    const handleSave = () => {
        if (!editForm.name) return;
        if (editingId === 'new') {
            onAdd({ ...editForm, id: crypto.randomUUID(), units: [{ id: crypto.randomUUID(), name: 'Main Unit' }] });
        } else {
            onUpdate(editForm);
        }
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight text-gray-900">Your Buildings</h2>
                <button onClick={() => { setEditingId('new'); setEditForm({ name: '', address: '' }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center shadow-sm">
                    <Plus size={16} className="mr-1.5" /> Add Property
                </button>
            </div>

            {editingId === 'new' && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-4">
                    <h3 className="font-semibold text-blue-900">New Property</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Property Name</label>
                            <input autoFocus type="text" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" placeholder="e.g. 123 Main St Duplex" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Address</label>
                            <input type="text" value={editForm.address || ''} onChange={(e) => setEditForm({...editForm, address: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" placeholder="123 Main St, Springfield UX" />
                        </div>
                    </div>
                    <div className="flex space-x-3 pt-2">
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">Save Property</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100">Cancel</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {properties.map((p: Property) => (
                    <div key={p.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors group relative">
                        {editingId === p.id ? (
                            <div className="space-y-4">
                                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="block w-full border-gray-300 rounded shadow-sm p-2 text-sm" />
                                <input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="block w-full border-gray-300 rounded shadow-sm p-2 text-sm" />
                                <div className="flex space-x-2">
                                    <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs">Save</button>
                                    <button onClick={() => setEditingId(null)} className="text-gray-500 px-3 py-1.5 rounded text-xs bg-gray-100">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                                    <button onClick={() => { setEditingId(p.id); setEditForm(p); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                    <button onClick={() => { if(confirm('Delete property?')) onDelete(p.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="bg-blue-100 p-2.5 rounded-lg text-blue-700"><Home size={20} /></div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{p.name}</h3>
                                        <p className="text-sm text-gray-500 flex items-center mt-1"><MapPin size={12} className="mr-1" /> {p.address || 'No address set'}</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Units</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {p.units?.map((u: Unit) => (
                                            <span key={u.id} className="bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-medium rounded-full border border-gray-200">{u.name}</span>
                                        ))}
                                        <button 
                                            onClick={() => {
                                                const newUnitName = prompt('Enter new unit name (e.g. Unit B):');
                                                if (newUnitName) {
                                                    const newUnit = { id: crypto.randomUUID(), name: newUnitName };
                                                    onUpdate({ ...p, units: [...(p.units || []), newUnit] });
                                                }
                                            }}
                                            className="bg-white border border-dashed border-gray-300 text-gray-500 px-2.5 py-1 text-xs font-medium rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors"
                                        >
                                            + Add Unit
                                        </button>
                                    </div>
                                    
                                    {/* Active Tenants preview */}
                                    <div className="mt-4 pt-3 border-t border-gray-50">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Current Tenants</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {leases.filter((l:any) => l.propertyId === p.id && l.isActive).map((l:any) => {
                                                const ten = tenants.find((t:any) => t.id === l.tenantId);
                                                return ten ? <span key={l.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">{ten.name}</span> : null;
                                            })}
                                            {leases.filter((l:any) => l.propertyId === p.id && l.isActive).length === 0 && (
                                                <span className="text-xs text-gray-400 italic">Vacant</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {properties.length === 0 && editingId !== 'new' && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                        No properties added yet. 
                    </div>
                )}
            </div>
        </div>
    );
};

// --- TENANTS TAB ---
const TenantsTab = ({ tenants, leases, properties, onAdd, onUpdate, onDelete }: any) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Tenant>>({});

    const handleSave = () => {
        if (!editForm.name) return;
        if (editingId === 'new') {
            onAdd({ ...editForm, id: crypto.randomUUID() });
        } else {
            onUpdate(editForm);
        }
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight text-gray-900">Tenant Directory</h2>
                <button onClick={() => { setEditingId('new'); setEditForm({ name: '', email: '' }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center shadow-sm">
                    <UserPlus size={16} className="mr-1.5" /> Add Tenant
                </button>
            </div>

            {editingId === 'new' && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-4">
                    <h3 className="font-semibold text-blue-900">New Tenant Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Primary Name</label>
                            <input autoFocus type="text" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Primary Email</label>
                            <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Co-Tenant Name</label>
                            <input type="text" value={editForm.coTenantName || ''} onChange={(e) => setEditForm({...editForm, coTenantName: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Co-Tenant Email</label>
                            <input type="email" value={editForm.coTenantEmail || ''} onChange={(e) => setEditForm({...editForm, coTenantEmail: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                    </div>
                    <div className="flex space-x-3 pt-2">
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">Save Tenant</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100">Cancel</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenants.map((t: Tenant) => (
                    <div key={t.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors group relative bg-white">
                         {editingId === t.id ? (
                            <div className="space-y-3">
                                <input type="text" placeholder="Name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="block w-full border-gray-300 rounded shadow-sm p-2 text-sm" />
                                <input type="email" placeholder="Email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="block w-full border-gray-300 rounded shadow-sm p-2 text-sm" />
                                <input type="text" placeholder="Co-Tenant Name" value={editForm.coTenantName} onChange={e => setEditForm({...editForm, coTenantName: e.target.value})} className="block w-full border-gray-300 rounded shadow-sm p-2 text-sm" />
                                <input type="email" placeholder="Co-Tenant Email" value={editForm.coTenantEmail} onChange={e => setEditForm({...editForm, coTenantEmail: e.target.value})} className="block w-full border-gray-300 rounded shadow-sm p-2 text-sm" />
                                <div className="flex space-x-2 pt-2">
                                    <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs flex-1">Save</button>
                                    <button onClick={() => setEditingId(null)} className="text-gray-500 px-3 py-1.5 rounded text-xs bg-gray-100 flex-1">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                    <button onClick={() => { setEditingId(t.id); setEditForm(t); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                                    <button onClick={() => { if(confirm('Delete tenant?')) onDelete(t.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                </div>
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="bg-gray-100 p-2.5 rounded-full text-gray-500"><Users size={20} /></div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 leading-tight">{t.name}</h3>
                                        {t.coTenantName && <p className="text-xs text-gray-500">& {t.coTenantName}</p>}
                                    </div>
                                </div>
                                <div className="space-y-1 mt-3">
                                    <p className="text-sm text-blue-600 truncate">{t.email}</p>
                                    {t.coTenantEmail && <p className="text-sm text-gray-500 truncate">{t.coTenantEmail}</p>}
                                </div>
                                <div className="mt-4 pt-3 border-t border-gray-50">
                                     <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Active Leases</h4>
                                     <div className="flex flex-col gap-1">
                                        {leases.filter((l:any) => l.tenantId === t.id && l.isActive).map((l:any) => {
                                            const prop = properties.find((p:any) => p.id === l.propertyId);
                                            const unit = prop?.units?.find((u:any) => u.id === l.unitId);
                                            return (
                                                <div key={l.id} className="text-xs text-gray-600 flex items-center">
                                                    <Home size={10} className="mr-1 text-gray-400" />
                                                    {prop?.name} {unit ? `(${unit.name})` : ''}
                                                </div>
                                            );
                                        })}
                                        {leases.filter((l:any) => l.tenantId === t.id && l.isActive).length === 0 && (
                                            <span className="text-xs text-gray-400 italic">No active contracts</span>
                                        )}
                                     </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- LEASES TAB ---
const LeasesTab = ({ leases, properties, tenants, onAdd, onUpdate, onDelete }: any) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Lease>>({});

    const handleSave = () => {
        if (!editForm.propertyId || !editForm.tenantId || !editForm.monthlyRent) return;
        if (editingId === 'new') {
            onAdd({ ...editForm, id: crypto.randomUUID(), isActive: true });
        } else {
            onUpdate(editForm);
        }
        setEditingId(null);
    };

    const getPropName = (id: string) => properties.find((p:any) => p.id === id)?.name || 'Unknown Property';
    const getUnitName = (pid: string, uid: string) => properties.find((p:any) => p.id === pid)?.units?.find((u:any) => u.id === uid)?.name || '';
    const getTenName = (id: string) => tenants.find((t:any) => t.id === id)?.name || 'Unknown Tenant';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight text-gray-900">Active Contracts</h2>
                <button onClick={() => { setEditingId('new'); setEditForm({ monthlyRent: 0, securityDeposit: 0, startDate: '', endDate: '' }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center shadow-sm">
                    <Plus size={16} className="mr-1.5" /> Create Lease
                </button>
            </div>

            {editingId === 'new' && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-4">
                    <h3 className="font-semibold text-blue-900">New Lease Agreement</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Property</label>
                            <select value={editForm.propertyId || ''} onChange={e => {
                                const pid = e.target.value;
                                const prop = properties.find((p:any) => p.id === pid);
                                setEditForm({...editForm, propertyId: pid, unitId: prop?.units?.[0]?.id || ''});
                            }} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white">
                                <option value="">Select Property...</option>
                                {properties.map((p:any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        {editForm.propertyId && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Unit</label>
                                <select value={editForm.unitId || ''} onChange={e => setEditForm({...editForm, unitId: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white">
                                    {properties.find((p:any) => p.id === editForm.propertyId)?.units?.map((u:any) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tenant</label>
                            <select value={editForm.tenantId || ''} onChange={e => setEditForm({...editForm, tenantId: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white">
                                <option value="">Select Tenant...</option>
                                {tenants.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Base Monthly Rent ($)</label>
                            <input type="number" value={editForm.monthlyRent || ''} onChange={(e) => setEditForm({...editForm, monthlyRent: parseFloat(e.target.value)})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Security Deposit ($)</label>
                            <input type="number" value={editForm.securityDeposit || ''} onChange={(e) => setEditForm({...editForm, securityDeposit: parseFloat(e.target.value)})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                <input type="date" value={editForm.startDate || ''} onChange={(e) => setEditForm({...editForm, startDate: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">End Date</label>
                                <input type="date" value={editForm.endDate || ''} onChange={(e) => setEditForm({...editForm, endDate: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                             </div>
                        </div>
                    </div>
                    <div className="flex space-x-3 pt-2">
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">Activate Lease</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100">Cancel</button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {leases.map((l: Lease) => (
                    <div key={l.id} className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${l.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                <span className="font-semibold text-gray-900 text-sm tracking-wide">{getPropName(l.propertyId)} {l.unitId && `— ${getUnitName(l.propertyId, l.unitId)}`}</span>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => { if(confirm('Delete Lease?')) onDelete(l.id); }} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Tenant</div>
                                <div className="font-medium text-gray-900">{getTenName(l.tenantId)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Base Rent</div>
                                <div className="font-bold text-gray-900 text-lg">${l.monthlyRent?.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Lease Term</div>
                                <div className="text-sm text-gray-900">{l.startDate || '—'} to {l.endDate || '—'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Deposit</div>
                                <div className="text-sm text-gray-900">${l.securityDeposit?.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                ))}
                {leases.length === 0 && editingId !== 'new' && (
                    <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                        No active lease agreements.
                    </div>
                )}
            </div>
        </div>
    );
};
