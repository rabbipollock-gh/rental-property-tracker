import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { calculateMonthStats, formatCurrency, formatDate } from '../utils/calculations';
import { MONTH_NAMES } from '../constants';
import { CheckCircle, AlertCircle, ChevronRight, ArrowRightLeft, Calendar, Search, Filter, Edit2, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Transactions: React.FC = () => {
    const { data, setEditTarget } = useStore();
    const [activeTab, setActiveTab] = useState<'ledger' | 'months'>('ledger');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

    const stats = useMemo(() => data.records.map(r => ({
        ...r,
        stats: calculateMonthStats(r)
    })), [data.records]);

    const allTransactions = useMemo(() => {
        return data.records.flatMap(r => [
            ...r.payments.map(p => ({ ...p, type: 'Rent Payment', amount: p.amount, isIncome: true, monthId: r.id, originalType: 'payment', item: p })),
            ...r.manualFees.map(f => ({ ...f, type: 'Manual Fee', amount: -f.amount, isIncome: false, monthId: r.id, originalType: 'fee', item: f })),
            ...r.adjustments.map(a => ({ ...a, type: `Adjustment (${a.reason})`, amount: a.amount, isIncome: a.amount >= 0, monthId: r.id, originalType: 'adjustment', item: a })),
            ...(r.expenses || []).map(e => ({ ...e, type: `Tenant Exp - ${e.category}`, amount: -e.amount, isIncome: false, monthId: r.id, originalType: 'expense', item: e }))
        ]).concat((data.propertyExpenses || []).map(e => ({ ...e, type: `Global Exp - ${e.category}`, amount: -e.amount, isIncome: false, monthId: '', originalType: 'expense', item: e })))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [data.records, data.propertyExpenses]);

    const filteredTransactions = useMemo(() => {
        return allTransactions.filter(t => {
            if (filterType === 'income' && !t.isIncome) return false;
            if (filterType === 'expense' && t.isIncome) return false;
            
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const textToSearch = `${t.type} ${t.date} ${(t as any).note || ''} ${(t as any).description || ''} ${(t as any).reason || ''}`.toLowerCase();
                if (!textToSearch.includes(searchLower)) return false;
            }
            return true;
        });
    }, [allTransactions, searchTerm, filterType]);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
                <div className="flex bg-gray-100 p-1 rounded-lg self-start md:self-auto">
                    <button onClick={() => setActiveTab('ledger')} className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'ledger' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        <ArrowRightLeft size={16} /><span>Master Ledger</span>
                    </button>
                    <button onClick={() => setActiveTab('months')} className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'months' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Calendar size={16} /><span>Billing Cycles</span>
                    </button>
                </div>
            </div>

            {activeTab === 'ledger' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    
                    {/* Filter & Search Bar */}
                    <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
                         <div className="relative w-full sm:max-w-xs">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                             <input 
                                type="text" 
                                placeholder="Search note, category..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                             />
                         </div>
                         <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-1 overflow-x-auto shrink-0">
                             <button onClick={() => setFilterType('all')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${filterType === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>All</button>
                             <button onClick={() => setFilterType('income')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${filterType === 'income' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>Income</button>
                             <button onClick={() => setFilterType('expense')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${filterType === 'expense' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:text-gray-700'}`}>Expenses</button>
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 hidden md:table-header-group">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Note</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 flex-1 sm:flex-none">
                                {filteredTransactions.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 block md:table-cell">No transactions matched your filters.</td></tr>
                                ) : (
                                    filteredTransactions.map((t, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition flex flex-col md:table-row p-4 md:p-0 border-b md:border-b-0">
                                            {/* Mobile: Date is top left */}
                                            <td className="md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 md:text-gray-900 mb-1 md:mb-0">
                                                {formatDate(t.date)}
                                            </td>
                                            
                                            {/* Type/Note */}
                                            <td className="md:px-6 md:py-4 text-sm flex-1 mb-3 md:mb-0">
                                                <div className="font-semibold text-gray-900">{t.type}</div>
                                                <div className="text-gray-500 text-xs">{(t as any).note || (t as any).description || (t as any).reason || '-'}</div>
                                            </td>
                                            
                                            {/* Amount */}
                                            <td className={`md:px-6 md:py-4 whitespace-nowrap text-lg md:text-sm text-left md:text-right font-bold mb-3 md:mb-0 ${t.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.isIncome ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
                                            </td>
                                            
                                            {/* Actions */}
                                            <td className="md:px-6 md:py-4 text-left md:text-right space-x-2 flex items-center justify-start md:justify-end">
                                                <button 
                                                    onClick={() => setEditTarget({ type: t.originalType as any, item: t.item as any, monthId: t.monthId })}
                                                    className="inline-flex items-center space-x-1 text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                                                >
                                                    <Pencil size={14} /> <span>Edit</span>
                                                </button>
                                                {t.monthId && (
                                                    <Link to={`/month/${t.monthId}`} className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-medium transition">
                                                        <span>View Month</span> <ChevronRight size={14} />
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'months' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                    {stats.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No billing cycles found. Add a month to begin.</div>
                    ) : (
                        stats.map((record) => (
                        <div key={record.id} className="p-4 md:px-6 hover:bg-gray-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-4 w-full sm:w-auto">
                                <div className={`p-2 rounded-full shrink-0 ${record.stats.isPaidOff ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {record.stats.isPaidOff ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">{MONTH_NAMES[record.month - 1]} {record.year}</h4>
                                    <p className="text-sm text-gray-500">Due: {record.dueDate}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between w-full sm:w-auto gap-8 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                                <div className="text-left sm:text-right">
                                    <p className="text-sm text-gray-500">Balance</p>
                                    <p className={`font-bold ${record.stats.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(record.stats.remainingBalance)}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Link
                                    to={`/month/${record.id}`}
                                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                                    >
                                    <ChevronRight size={20} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                        ))
                    )}
                    </div>
                </div>
            )}
        </div>
    );
};
