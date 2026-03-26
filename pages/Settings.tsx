import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Save, User, Tags, Mail, Terminal as TerminalIcon } from 'lucide-react';
import { ErrorLog } from './ErrorLog';

type Tab = 'profile' | 'categories' | 'email' | 'logs';

export const Settings: React.FC = () => {
  const { data, updateSettings } = useStore();
  const [formData, setFormData] = useState(data.settings);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('profile');

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
    <div className="max-w-5xl mx-auto space-y-6">
       <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            {msg && <span className="text-green-600 text-sm font-medium animate-pulse bg-green-50 px-3 py-1 rounded-full">{msg}</span>}
       </div>

       <div className="flex flex-col md:flex-row gap-6">
           {/* Sidebar Tabs */}
           <div className="w-full md:w-64 space-y-1">
               <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                   <User size={18} /><span>Landlord Profile</span>
               </button>
               <button onClick={() => setActiveTab('categories')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                   <Tags size={18} /><span>Categories</span>
               </button>
               <button onClick={() => setActiveTab('email')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'email' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                   <Mail size={18} /><span>Email Delivery</span>
               </button>
               <button onClick={() => setActiveTab('logs')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'logs' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                   <TerminalIcon size={18} /><span>System Logs</span>
               </button>
           </div>

           {/* Content Area */}
           <div className="flex-1">
               {activeTab === 'logs' ? (
                   <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                       <ErrorLog />
                   </div>
               ) : (
                   <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">
                        {activeTab === 'profile' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-6">Landlord Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Name / Business Name</label>
                                        <input type="text" name="landlordName" value={formData.landlordName} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Support Email</label>
                                        <input type="email" name="landlordEmail" value={formData.landlordEmail} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Business Address</label>
                                        <textarea name="landlordAddress" rows={3} value={formData.landlordAddress} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'categories' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-6">System Categories</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Fee Categories (comma-separated)</label>
                                        <textarea 
                                            name="feeCategories" 
                                            rows={3} 
                                            value={(formData.feeCategories || []).join(', ')} 
                                            onChange={handleCategoryChange} 
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" 
                                            placeholder="Eviction, Late Fee, Maintenance, Other"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Expense Categories (comma-separated)</label>
                                        <textarea 
                                            name="expenseCategories" 
                                            rows={3} 
                                            value={(formData.expenseCategories || []).join(', ')} 
                                            onChange={handleCategoryChange} 
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 focus:border-blue-500 focus:ring-blue-500" 
                                            placeholder="Maintenance, Utilities, Taxes, Insurance, Other"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'email' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-6">Email Delivery Pipeline</h3>
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 tracking-wide leading-relaxed">
                                    <p className="text-sm text-blue-800">
                                      To blast PDFs directly from your own Gmail account, generate an <strong>App Password</strong> mathematically mapped to your Google Account. Your credentials remain permanently encrypted within the private Supabase partition wall.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Gmail App Password</label>
                                        <input type="password" name="gmailAppPassword" value={formData.gmailAppPassword || ''} onChange={handleChange} placeholder="16-character app password" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5 font-mono text-sm focus:border-blue-500 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-8 mt-4 border-t flex justify-end">
                            <button type="submit" className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 shadow-md transition font-medium">
                                <Save size={18} />
                                <span>Save Changes</span>
                            </button>
                        </div>
                   </form>
               )}
           </div>
       </div>
    </div>
  );
};