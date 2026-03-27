import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { MaintenanceTicket, Property, Tenant } from '../types';
import { useStore } from '../hooks/useStore';
import { CheckCircle2, AlertCircle, Clock, Search, Filter } from 'lucide-react';

export const Maintenance: React.FC = () => {
    const { properties, tenants } = useStore();
    const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('All');

    useEffect(() => {
        const fetchAllTickets = async () => {
            if (!supabase) return;
            const { data } = await supabase
                .from('maintenance_tickets')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) setTickets(data as MaintenanceTicket[]);
            setLoading(false);
        };
        fetchAllTickets();
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('maintenance_tickets')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);
            
        if (!error) {
            setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus as any } : t));
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            'Open': 'bg-gray-100 text-gray-800 border-gray-200',
            'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
            'Scheduled': 'bg-purple-100 text-purple-800 border-purple-200',
            'Resolved': 'bg-green-100 text-green-800 border-green-200'
        };
        return <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${colors[status] || colors['Open']}`}>{status}</span>;
    };

    const PriorityBadge = ({ priority }: { priority: string }) => {
        const isHigh = priority === 'Emergency' || priority === 'High';
        return <span className={`text-[10px] uppercase font-bold flex items-center ${isHigh ? 'text-red-600' : 'text-gray-500'}`}>
            {isHigh && <AlertCircle size={10} className="mr-1" />}
            {priority}
        </span>;
    };

    const filteredTickets = tickets.filter(t => filterStatus === 'All' || t.status === filterStatus);

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading repair requests...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Maintenance Queue</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage tenant repair requests and progress timelines.</p>
                </div>
                <div className="flex space-x-2">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-gray-300 text-sm rounded-lg px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none">
                        <option value="All">All statuses</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left font-semibold text-gray-600">Ticket Details</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-600">Property & Tenant</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-600">Timeline / Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {filteredTickets.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                    No active maintenance requests found.
                                </td>
                            </tr>
                        ) : filteredTickets.map(t => {
                            const prop = properties?.find(p => p.id === t.property_id);
                            const ten = tenants?.find(tenant => tenant.id === t.tenant_id);
                            
                            return (
                                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-start flex-col">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <PriorityBadge priority={t.priority} />
                                                <span className="text-gray-300">•</span>
                                                <span className="text-xs text-gray-500">{t.category}</span>
                                            </div>
                                            <p className="font-bold text-gray-900">{t.title}</p>
                                            <p className="text-gray-600 mt-1 text-xs line-clamp-2 max-w-sm">{t.description}</p>
                                            <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide flex items-center">
                                                <Clock size={10} className="mr-1" />
                                                {new Date(t.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <p className="font-medium text-gray-900">{prop?.name || 'Unknown Property'}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{ten?.name || 'Unknown Tenant'}</p>
                                            {ten?.phone && <p className="text-blue-600 text-[10px] mt-1 break-all max-w-[120px] truncate">{ten.phone}</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col space-y-3">
                                            <div><StatusBadge status={t.status} /></div>
                                            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                                                {['Open', 'In Progress', 'Scheduled', 'Resolved'].map((step) => (
                                                    <button 
                                                        key={step} 
                                                        onClick={() => updateStatus(t.id, step)}
                                                        className={`flex-1 text-[10px] py-1 px-1.5 rounded font-medium text-center transition-colors ${t.status === step ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-800'}`}
                                                    >
                                                        {step.split(' ')[0]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
