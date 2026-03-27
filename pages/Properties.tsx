import React, { useState, useRef } from 'react';
import { useStore } from '../hooks/useStore';
import { Building, Users, FileSignature, Plus, Edit2, Trash2, Home, UserPlus, MapPin, Upload, Download, ExternalLink } from 'lucide-react';
import { Property, Tenant, Lease, Unit, ImportResult } from '../types';
import { Modal } from '../components/Modal';
import * as Papa from 'papaparse';

type Tab = 'properties' | 'tenants' | 'leases';

export const Properties: React.FC = () => {
  const { properties, tenants, leases, addProperty, updateProperty, deleteProperty, addTenant, updateTenant, deleteTenant, addLease, updateLease, deleteLease, clearPropertyData } = useStore();
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
          {activeTab === 'properties' && <PropertiesTab properties={properties || []} leases={leases || []} tenants={tenants || []} onAdd={addProperty} onUpdate={updateProperty} onDelete={deleteProperty} onClearData={clearPropertyData} />}
          {activeTab === 'tenants' && <TenantsTab tenants={tenants || []} leases={leases || []} properties={properties || []} onAdd={addTenant} onUpdate={updateTenant} onDelete={deleteTenant} />}
          {activeTab === 'leases' && <LeasesTab leases={leases || []} properties={properties || []} tenants={tenants || []} onAdd={addLease} onUpdate={updateLease} onDelete={deleteLease} />}
       </div>
    </div>
  );
};

// --- PROPERTIES TAB ---
const PropertiesTab = ({ properties, leases, tenants, onAdd, onUpdate, onDelete, onClearData }: any) => {
    const { importData } = useStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Property>>({});
    
    // Importer State
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [importTargetId, setImportTargetId] = useState<string | null>(null);
    const [importError, setImportError] = useState('');
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!importTargetId) return;
      const file = e.target.files?.[0];
      if (!file) return;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setImportError('Error parsing CSV. Please check the format.');
            return;
          }
          const result = importData(results.data, importTargetId);
          setImportResult(result);
          setImportError('');
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        error: (error) => setImportError(error.message)
      });
    };

    const downloadTemplate = () => {
        const csvContent = "Date,Category,Description,Charge,Payment,Balance\n2026-03-01,Rent,Monthly Rent Baseline,1500,,\n2026-03-05,Payment,Bank Transfer,,1500,\n";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "Property_Import_Template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                                    <button onClick={() => { setImportTargetId(p.id); setImportModalOpen(true); }} className="px-2 py-1 mr-2 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded border border-transparent hover:border-blue-100 transition-colors flex items-center"><Upload size={10} className="mr-1" /> Import CSV</button>
                                    <button onClick={() => { if(confirm('Clear all ledger records and expenses for this property? The building itself will remain.')) onClearData(p.id); }} className="px-2 py-1 mr-2 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-colors">Clear Ledgers</button>
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

            {/* Import CSV Modal */}
            <Modal isOpen={isImportModalOpen} onClose={() => { setImportModalOpen(false); setImportError(''); setImportResult(null); setImportTargetId(null); }} title={`Import Data to Property`}>
              {importResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${importResult.rowsImported > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <h3 className="font-semibold text-gray-900">Import Complete</h3>
                    <p className="text-sm text-gray-600">Processed {importResult.rowsProcessed} rows. Imported {importResult.rowsImported} items.</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2 bg-gray-50">
                    {importResult.logs.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">No logs generated.</p>
                    ) : (
                      importResult.logs.map((log, i) => (
                        <div key={i} className={`text-xs p-2 rounded border ${log.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
                          log.type === 'warning' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                            'bg-white border-gray-200 text-gray-600'
                          }`}>
                          <span className="font-semibold uppercase mr-2">{log.type}</span>
                          {log.row && <span className="text-gray-400 mr-2">Row {log.row}:</span>}
                          {log.message}
                        </div>
                      ))
                    )}
                  </div>
                  <button onClick={() => { setImportModalOpen(false); setImportResult(null); setImportTargetId(null); }} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Done</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Upload a CSV mapped strictly to this property ledger.</p>
                    <button onClick={downloadTemplate} className="text-xs flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1.5 rounded font-medium border border-blue-100 transition-colors">
                        <Download size={14} className="mr-1" /> Template
                    </button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="font-mono font-medium pb-2 pr-4">Date</th>
                          <th className="font-mono font-medium pb-2 pr-4">Category</th>
                          <th className="font-mono font-medium pb-2 pr-4">Description</th>
                          <th className="font-mono font-medium pb-2 pr-4">Charge</th>
                          <th className="font-mono font-medium pb-2 pr-4">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700">
                        <tr>
                          <td className="pr-4">YYYY-MM-DD</td>
                          <td className="pr-4">Rent | Payment | Fee</td>
                          <td className="pr-4">Optional text</td>
                          <td className="pr-4">Number</td>
                          <td className="pr-4">Number</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {importError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{importError}</div>}
                  <div className="pt-4">
                    <label className="block w-full text-center bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer p-6 rounded-xl transition">
                      <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                      <span className="text-sm font-medium text-gray-600">Click to select CSV file</span>
                      <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} ref={fileInputRef} />
                    </label>
                  </div>
                </div>
              )}
            </Modal>
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
                <button onClick={() => { setEditingId('new'); setEditForm({ name: '', email: '', phone: '' }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center shadow-sm">
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
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Phone Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                            <input type="tel" value={editForm.phone || ''} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" placeholder="(555) 123-4567" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Co-Tenant Name</label>
                            <input type="text" value={editForm.coTenantName || ''} onChange={(e) => setEditForm({...editForm, coTenantName: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Co-Tenant Email</label>
                            <input type="email" value={editForm.coTenantEmail || ''} onChange={(e) => setEditForm({...editForm, coTenantEmail: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Co-Tenant Phone</label>
                            <input type="tel" value={editForm.phone2 || ''} onChange={(e) => setEditForm({...editForm, phone2: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
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
                                <input type="tel" placeholder="Phone" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="block w-full border-gray-300 rounded shadow-sm p-2 text-sm" />
                                <input type="text" placeholder="Co-Tenant Name" value={editForm.coTenantName} onChange={e => setEditForm({...editForm, coTenantName: e.target.value})} className="block w-full border-gray-300 rounded shadow-sm p-2 text-sm" />
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="email" placeholder="Co-Tenant Email" value={editForm.coTenantEmail} onChange={e => setEditForm({...editForm, coTenantEmail: e.target.value})} className="block w-full border-gray-300 rounded shadow-sm p-2 text-sm" />
                                    <input type="tel" placeholder="Co-Tenant Phone" value={editForm.phone2 || ''} onChange={e => setEditForm({...editForm, phone2: e.target.value})} className="block w-full border-gray-300 rounded shadow-sm p-2 text-sm" />
                                </div>
                                <div className="flex space-x-2 pt-2">
                                    <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs flex-1">Save</button>
                                    <button onClick={() => setEditingId(null)} className="text-gray-500 px-3 py-1.5 rounded text-xs bg-gray-100 flex-1">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                    <button onClick={() => {
                                        if (!t.email) {
                                            alert("Please add an email address to this tenant first.");
                                            return;
                                        }
                                        const appUrl = window.location.origin + window.location.pathname;
                                        const subject = encodeURIComponent("You've been invited to the Tenant Portal");
                                        const body = encodeURIComponent(`Hi ${t.name},\n\nYour landlord has invited you to access your Tenant Portal.\n\nPlease visit ${appUrl} and click "Magic Link Sign In" using your email address: ${t.email}\n\nThank you.`);
                                        window.location.href = `mailto:${t.email}?subject=${subject}&body=${body}`;
                                    }} title="Invite to Portal" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"><Users size={14} /></button>
                                    <button onClick={() => window.open(`/#/preview/${t.id}`, '_blank')} title="Preview Tenant Portal" className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"><ExternalLink size={14} /></button>
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
                                    {t.phone && <p className="text-sm text-gray-600 truncate">{t.phone}</p>}
                                    {(t.coTenantEmail || t.phone2) && (
                                        <p className="text-sm text-gray-500 truncate">
                                            {t.coTenantEmail} {t.coTenantEmail && t.phone2 ? '•' : ''} {t.phone2}
                                        </p>
                                    )}
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
    const { addTenant } = useStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Lease>>({});
    
    // Inline Tenant Creation State
    const [isCreatingTenant, setIsCreatingTenant] = useState(false);
    const [newTenantForm, setNewTenantForm] = useState({ name: '', email: '', phone: '' });

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
                        <div className="col-span-1 md:col-span-2 relative p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">Tenant</label>
                                {!isCreatingTenant && (
                                    <button onClick={(e) => { e.preventDefault(); setIsCreatingTenant(true); }} className="text-xs text-blue-600 font-medium hover:underline flex items-center">
                                        <Plus size={12} className="mr-0.5" /> New Tenant
                                    </button>
                                )}
                            </div>
                            
                            {isCreatingTenant ? (
                                <div className="space-y-3 mt-2 bg-white p-3 rounded border shadow-sm">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Full Name</label>
                                        <input autoFocus type="text" value={newTenantForm.name} onChange={e => setNewTenantForm({...newTenantForm, name: e.target.value})} className="mt-1 block w-full text-sm border-gray-300 rounded-md p-1.5 border" placeholder="e.g. John Doe" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Email</label>
                                            <input type="email" value={newTenantForm.email} onChange={e => setNewTenantForm({...newTenantForm, email: e.target.value})} className="mt-1 block w-full text-sm border-gray-300 rounded-md p-1.5 border" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Phone</label>
                                            <input type="tel" value={newTenantForm.phone} onChange={e => setNewTenantForm({...newTenantForm, phone: e.target.value})} className="mt-1 block w-full text-sm border-gray-300 rounded-md p-1.5 border" />
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 pt-1">
                                        <button onClick={(e) => {
                                            e.preventDefault();
                                            if (!newTenantForm.name) return;
                                            const newId = crypto.randomUUID();
                                            addTenant({ id: newId, ...newTenantForm });
                                            setEditForm({...editForm, tenantId: newId});
                                            setIsCreatingTenant(false);
                                            setNewTenantForm({ name: '', email: '', phone: '' });
                                        }} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700">Save & Select</button>
                                        <button onClick={(e) => { e.preventDefault(); setIsCreatingTenant(false); }} className="text-gray-500 px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <select value={editForm.tenantId || ''} onChange={e => setEditForm({...editForm, tenantId: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white">
                                    <option value="">Select Tenant...</option>
                                    {tenants.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            )}
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
                                <button onClick={() => { setEditingId(l.id); setEditForm(l); }} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 size={16} /></button>
                                <button onClick={() => { if(confirm('Delete Lease?')) onDelete(l.id); }} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
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
                        {editingId === l.id && (
                            <div className="p-5 border-t border-gray-100 bg-gray-50 space-y-4">
                                <h4 className="text-sm font-semibold text-gray-700">Edit Basic Information</h4>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Base Rent ($)</label>
                                        <input type="number" value={editForm.monthlyRent} onChange={e => setEditForm({...editForm, monthlyRent: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md shadow-sm border-gray-300 p-2 text-sm border bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Deposit ($)</label>
                                        <input type="number" value={editForm.securityDeposit} onChange={e => setEditForm({...editForm, securityDeposit: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md shadow-sm border-gray-300 p-2 text-sm border bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Start Date</label>
                                        <input type="date" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} className="mt-1 block w-full rounded-md shadow-sm border-gray-300 p-2 text-sm border bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">End Date</label>
                                        <input type="date" value={editForm.endDate} onChange={e => setEditForm({...editForm, endDate: e.target.value})} className="mt-1 block w-full rounded-md shadow-sm border-gray-300 p-2 text-sm border bg-white" />
                                    </div>
                                </div>
                                <div className="flex space-x-2 pt-2">
                                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">Save Details</button>
                                    <button onClick={() => setEditingId(null)} className="text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 bg-white border border-gray-200 shadow-sm">Cancel</button>
                                </div>
                            </div>
                        )}
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
