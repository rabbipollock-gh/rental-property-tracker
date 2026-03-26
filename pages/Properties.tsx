import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Save, Building, Users } from 'lucide-react';

export const Properties: React.FC = () => {
  const { data, updateSettings } = useStore();
  const [formData, setFormData] = useState(data.settings);
  const [msg, setMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setMsg('Property & Lease updated successfully!');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
       <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Properties & Leases</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your active property, tenant assignments, and financial lease terms.</p>
            </div>
            {msg && <span className="text-green-600 text-sm font-medium animate-pulse bg-green-50 px-3 py-1 rounded-full">{msg}</span>}
       </div>

       <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-10">
            
            {/* Property Address */}
            <div>
                <div className="flex items-center space-x-2 border-b pb-2 mb-6">
                    <Building className="text-blue-600" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900">Property Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                         <label className="block text-sm font-medium text-gray-700">Property Address (Appears on Statements)</label>
                         <input type="text" name="propertyAddress" value={formData.propertyAddress} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. 123 Main St, Apt 4B, Sunnyvale, CA 94086"/>
                    </div>
                </div>
            </div>

            {/* Tenant Details */}
            <div>
                <div className="flex items-center space-x-2 border-b pb-2 mb-6">
                    <Users className="text-blue-600" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900">Active Tenant Profiles</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Primary Tenant Name</label>
                        <input type="text" name="tenantName" value={formData.tenantName} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Primary Tenant Email</label>
                        <input type="email" name="tenantEmail" value={formData.tenantEmail} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Co-Tenant Name (Optional)</label>
                        <input type="text" name="tenantName2" value={formData.tenantName2 || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Co-Tenant Email (Optional)</label>
                        <input type="email" name="tenantEmail2" value={formData.tenantEmail2 || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Tenant Mailing Address (If different from Property)</label>
                        <textarea name="tenantAddress" rows={2} value={formData.tenantAddress} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                </div>
            </div>

            {/* Lease Limits */}
            <div>
                <div className="flex items-center space-x-2 border-b pb-2 mb-6">
                    <div className="text-blue-600 font-bold text-xl">$</div>
                    <h3 className="text-lg font-semibold text-gray-900">Lease & Financials</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Lease Start Date</label>
                        <input type="date" name="leaseStartDate" value={formData.leaseStartDate || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Lease End Date</label>
                        <input type="date" name="leaseEndDate" value={formData.leaseEndDate || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Security Deposit Required ($)</label>
                        <input type="number" name="securityDepositAmount" value={formData.securityDepositAmount || 0} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Security Deposit Held ($)</label>
                        <input type="number" name="securityDepositHeld" value={formData.securityDepositHeld || 0} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                </div>
            </div>

            <div className="pt-6 flex justify-end">
                <button type="submit" className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 shadow-md transition font-medium">
                    <Save size={18} />
                    <span>Save Property</span>
                </button>
            </div>
       </form>
    </div>
  );
};
