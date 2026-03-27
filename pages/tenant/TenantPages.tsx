import React from 'react';
import { useTenantData } from '../../hooks/tenant/useTenantData';
import { Home, Calendar, DollarSign, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export const TenantDashboard: React.FC = () => {
    const { profile, lease, property, records, loading, error } = useTenantData();

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Syncing with Landlord...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    if (!lease) {
        return (
            <div className="space-y-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="bg-blue-50 p-4 rounded-full text-blue-500 mb-2"><Home size={32} /></div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome, {profile?.name || 'Tenant'}</h2>
                <p className="text-gray-500 max-w-sm">We couldn't find an active lease associated with this account. If you believe this is an error, please contact your property manager.</p>
            </div>
        );
    }

    // Calculations for Account Summary
    const sortedRecords = [...records].sort((a, b) => b.id.localeCompare(a.id));
    const currentRecord = sortedRecords[0];

    const calculateRecordBalance = (record: any) => {
        const totalDue = record.monthlyRent + 
            (record.lateFeeOverride || 0) + 
            record.manualFees.reduce((sum: number, f: any) => sum + f.amount, 0) + 
            record.adjustments.filter((a: any) => a.amount > 0).reduce((sum: number, a: any) => sum + a.amount, 0);
        
        const totalPaid = record.payments.reduce((sum: number, p: any) => sum + p.amount, 0) + 
            Math.abs(record.adjustments.filter((a: any) => a.amount < 0).reduce((sum: number, a: any) => sum + a.amount, 0));
        
        return totalDue - totalPaid;
    };

    const totalBalance = records.reduce((sum, r) => sum + calculateRecordBalance(r), 0);
    const isOverdue = totalBalance > 0;

    return (
        <div className="space-y-6 pb-6">
            <header className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Hi, {profile?.name.split(' ')[0]} 👋</h2>
                <p className="text-gray-500 flex items-center mt-1"><MapPinIcon size={14} className="mr-1"/> {property?.name}</p>
            </header>

            {/* Account Summary Card */}
            <div className={`overflow-hidden rounded-2xl shadow-sm border ${isOverdue ? 'bg-red-50 border-red-100' : 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-700 text-white'}`}>
                <div className="p-6">
                    <p className={`text-sm font-medium opacity-90 ${isOverdue ? 'text-red-800' : 'text-blue-100'}`}>Current Balance</p>
                    <div className="mt-1 flex items-baseline">
                        <span className={`text-4xl font-extrabold tracking-tight ${isOverdue ? 'text-red-600' : 'text-white'}`}>
                            ${Math.max(0, totalBalance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </span>
                    </div>
                    {isOverdue && (
                        <div className="mt-3 flex items-center text-sm text-red-700 bg-red-100/50 p-2 rounded-lg font-medium">
                            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                            Your account is past due.
                        </div>
                    )}
                    {!isOverdue && currentRecord && (
                        <div className="mt-4 pt-4 border-t border-blue-500/30 flex items-center justify-between">
                            <div className="flex items-center text-blue-50">
                                <Calendar size={16} className="mr-2 opacity-70" />
                                <span className="text-sm">Next Rent Due</span>
                            </div>
                            <span className="text-sm font-semibold">{new Date(currentRecord.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <DollarSign size={24} className="text-green-600 mb-2" />
                    <span className="text-sm font-semibold text-gray-800">Make Payment</span>
                </button>
                <button className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <AlertCircle size={24} className="text-orange-500 mb-2" />
                    <span className="text-sm font-semibold text-gray-800">Request Repair</span>
                </button>
            </div>

            {/* Ledger History */}
            <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><FileText size={18} className="mr-2" /> Recent Ledger</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {sortedRecords.slice(0, 5).map((record) => {
                        const bal = calculateRecordBalance(record);
                        const isPaid = bal <= 0.01;
                        return (
                            <div key={record.id} className="p-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-semibold text-gray-900">{new Date(record.year, record.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric'})}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Due {new Date(record.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">${(record.monthlyRent + (record.lateFeeOverride || 0)).toLocaleString()}</p>
                                    {isPaid ? (
                                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-green-600 mt-1"><CheckCircle2 size={12} className="mr-1"/> Paid</span>
                                    ) : (
                                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-red-500 mt-1">Owes ${bal.toFixed(2)}</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {sortedRecords.length === 0 && (
                        <div className="p-6 text-center text-sm text-gray-500">No ledger history available yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MapPinIcon = ({size, className}: {size:number, className:string}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;

import { supabase } from '../../services/supabaseClient';
import { MaintenanceTicket } from '../../types';

export const TenantMaintenance: React.FC = () => {
    const { profile, property } = useTenantData();
    const [tickets, setTickets] = React.useState<MaintenanceTicket[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [form, setForm] = React.useState({ title: '', description: '', category: 'General', priority: 'Normal' });

    React.useEffect(() => {
        const fetchTickets = async () => {
            if (!profile?.id) return;
            const { data } = await supabase
                .from('maintenance_tickets')
                .select('*')
                .eq('tenant_id', profile.id)
                .order('created_at', { ascending: false });
            if (data) setTickets(data as MaintenanceTicket[]);
        };
        fetchTickets();
    }, [profile?.id]);

    const submitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.id || !property?.id || !profile?.ownerId) return;
        setIsSubmitting(true);
        const newTicket = {
            owner_id: profile.ownerId,
            tenant_id: profile.id,
            property_id: property.id,
            title: form.title,
            description: form.description,
            category: form.category,
            priority: form.priority,
            status: 'Open'
        };
        const { data, error } = await supabase.from('maintenance_tickets').insert([newTicket]).select();
        setIsSubmitting(false);
        if (error) alert(error.message);
        else if (data) {
            setTickets([data[0] as MaintenanceTicket, ...tickets]);
            setForm({ title: '', description: '', category: 'General', priority: 'Normal' });
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            'Open': 'bg-gray-100 text-gray-800 border-gray-200',
            'In Progress': 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse',
            'Scheduled': 'bg-purple-100 text-purple-800 border-purple-200',
            'Resolved': 'bg-green-100 text-green-800 border-green-200'
        };
        return <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border ${colors[status] || colors['Open']}`}>{status}</span>;
    };

    return (
        <div className="space-y-6 pb-6 animate-in fade-in slide-in-from-bottom-2">
            <header>
                <h2 className="text-2xl font-bold text-gray-900">Repair Requests</h2>
                <p className="text-sm text-gray-500 mt-1">Submit tickets directly to your landlord.</p>
            </header>

            {/* New Ticket Form */}
            <form onSubmit={submitTicket} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700">Issue summary</label>
                    <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="mt-1 block w-full border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors" placeholder="e.g. Broken garbage disposal" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Category</label>
                        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="mt-1 block w-full border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm focus:ring-blue-500 focus:bg-white">
                            <option>Plumbing</option><option>Electrical</option><option>HVAC</option><option>Appliance</option><option>Structural</option><option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Priority</label>
                        <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="mt-1 block w-full border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm focus:ring-blue-500 focus:bg-white">
                            <option>Low</option><option>Normal</option><option>High</option><option>Emergency</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700">Details</label>
                    <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="mt-1 block w-full border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm focus:ring-blue-500 focus:bg-white transition-colors" placeholder="Please describe the issue..." />
                </div>
                <button disabled={isSubmitting} type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-sm hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-70 disabled:animate-pulse">
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
            </form>

            {/* Ticket Feed */}
            <div className="space-y-4 pt-4">
                <h3 className="font-bold text-gray-900 border-b pb-2">Your Tickets</h3>
                {tickets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">No active maintenance requests.</div>
                ) : tickets.map(t => (
                    <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${t.status === 'Resolved' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900 pr-4">{t.title}</h4>
                            <StatusBadge status={t.status} />
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{t.description}</p>
                        
                        {/* Pizza-Tracker Timeline */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest relative">
                            {/* Line connecting the dots */}
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
                            
                            {['Open', 'In Progress', 'Scheduled', 'Resolved'].map((step, idx, arr) => {
                                const currentIndex = arr.indexOf(t.status);
                                const isCompleted = idx <= currentIndex;
                                const isCurrent = idx === currentIndex;
                                return (
                                    <div key={step} className="relative z-10 flex flex-col items-center gap-1.5 w-1/4">
                                        <div className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${isCompleted ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-200'} ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}></div>
                                        <span className={`text-center leading-tight hidden sm:block ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-600' : ''}`}>{step}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

import { DocumentItem } from '../../types';
import { ExternalLink, Download } from 'lucide-react';

export const TenantDocs: React.FC = () => {
    const { profile } = useTenantData();
    const [docs, setDocs] = React.useState<DocumentItem[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchDocs = async () => {
            if (!profile?.id) return;
            const { data } = await supabase
                .from('documents')
                .select('*')
                .eq('tenant_id', profile.id)
                .order('created_at', { ascending: false });
            
            if (data) {
                // Map the snake_case DB to camelCase Frontend Types
                const typedDocs = data.map(d => ({
                    id: d.id,
                    name: d.name,
                    type: d.type,
                    url: d.url,
                    dateAdded: (d as any).date_added || d.created_at,
                    propertyId: d.property_id,
                    tenantId: d.tenant_id
                })) as DocumentItem[];
                setDocs(typedDocs);
            }
            setLoading(false);
        };
        fetchDocs();
    }, [profile?.id]);

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Accessing Document Vault...</div>;

    return (
        <div className="space-y-6 pb-6 animate-in fade-in slide-in-from-bottom-2">
            <header>
                <h2 className="text-2xl font-bold text-gray-900">My Documents</h2>
                <p className="text-sm text-gray-500 mt-1">View your active lease agreements, riders, and receipts.</p>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {docs.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="bg-blue-50 text-blue-500 p-5 rounded-full mb-4">
                            <FileText size={32} />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">Vault is empty</h3>
                        <p className="text-sm text-gray-500 max-w-[200px]">Your landlord hasn't uploaded any documents to your profile yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {docs.map(doc => (
                            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors group">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">{doc.name}</h4>
                                        <div className="flex items-center space-x-2 mt-0.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{doc.type}</span>
                                            <span className="text-[10px] text-gray-400">Added {new Date(doc.dateAdded).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors bg-white shadow-sm border border-gray-100 group-hover:border-blue-200">
                                    <Download size={16} />
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const TenantPay: React.FC = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Make a Payment</h2>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-600">Check your outstanding balance and submit digital payments.</p>
            </div>
        </div>
    );
};
