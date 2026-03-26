import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Save } from 'lucide-react';

export const Settings: React.FC = () => {
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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.split(',').map(s => s.trim()).filter(Boolean) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setMsg('Settings saved successfully!');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            {msg && <span className="text-green-600 text-sm font-medium animate-pulse">{msg}</span>}
       </div>

       <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">
            
            {/* Landlord Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Landlord Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name / Business Name</label>
                        <input type="text" name="landlordName" value={formData.landlordName} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email (Used for replying to statements)</label>
                        <input type="email" name="landlordEmail" value={formData.landlordEmail} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Address (For Statements)</label>
                        <textarea name="landlordAddress" rows={2} value={formData.landlordAddress} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
                    </div>
                </div>
            </div>

            {/* Email Config Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Email Delivery Settings</h3>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6">
                    <p className="text-sm text-blue-800">
                      To send emails directly from your Gmail account, generate an <strong>App Password</strong> in your Google Account settings (Security {'>'} 2-Step Verification {'>'} App Passwords). Your credentials are saved securely in your private, encrypted database row.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Gmail App Password</label>
                        <input type="password" name="gmailAppPassword" value={formData.gmailAppPassword || ''} onChange={handleChange} placeholder="16-character app password" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2 font-mono text-sm" />
                    </div>
                </div>
            </div>

            {/* Tenant Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Tenant Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Primary Tenant Name</label>
                        <input type="text" name="tenantName" value={formData.tenantName} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Primary Tenant Email</label>
                        <input type="email" name="tenantEmail" value={formData.tenantEmail} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Co-Tenant Name (Optional)</label>
                        <input type="text" name="tenantName2" value={formData.tenantName2 || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Co-Tenant Email (Optional)</label>
                        <input type="email" name="tenantEmail2" value={formData.tenantEmail2 || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Tenant Address</label>
                        <textarea name="tenantAddress" rows={2} value={formData.tenantAddress} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
                    </div>
                    <div className="md:col-span-2">
                         <label className="block text-sm font-medium text-gray-700">Property Address (If different from tenant)</label>
                         <input type="text" name="propertyAddress" value={formData.propertyAddress} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
                    </div>
                </div>
            </div>

            {/* Lease & Financials Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Lease & Financials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Lease Start Date</label>
                        <input type="date" name="leaseStartDate" value={formData.leaseStartDate || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Lease End Date</label>
                        <input type="date" name="leaseEndDate" value={formData.leaseEndDate || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Security Deposit Required ($)</label>
                        <input type="number" name="securityDepositAmount" value={formData.securityDepositAmount || 0} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Security Deposit Held ($)</label>
                        <input type="number" name="securityDepositHeld" value={formData.securityDepositHeld || 0} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Categories</h3>
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fee Categories (comma-separated)</label>
                        <textarea 
                            name="feeCategories" 
                            rows={2} 
                            value={(formData.feeCategories || []).join(', ')} 
                            onChange={handleCategoryChange} 
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" 
                            placeholder="Eviction, Late Fee, Maintenance, Other"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Expense Categories (comma-separated)</label>
                        <textarea 
                            name="expenseCategories" 
                            rows={2} 
                            value={(formData.expenseCategories || []).join(', ')} 
                            onChange={handleCategoryChange} 
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" 
                            placeholder="Maintenance, Utilities, Taxes, Insurance, Other"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button type="submit" className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md transition">
                    <Save size={18} />
                    <span>Save Changes</span>
                </button>
            </div>
       </form>
    </div>
  );
};