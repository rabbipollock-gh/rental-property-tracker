import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { calculateMonthStats, formatCurrency, formatDate } from '../utils/calculations';
import { MONTH_NAMES } from '../constants';
import { CheckCircle, AlertCircle, ChevronRight, ArrowRightLeft, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Transactions: React.FC = () => {
    const { data } = useStore();
    const [activeTab, setActiveTab] = useState<'ledger' | 'months'>('ledger');

    const stats = data.records.map(r => ({
        ...r,
        stats: calculateMonthStats(r)
    }));

    const allTransactions = data.records.flatMap(r => [
        ...r.payments.map(p => ({ ...p, type: 'Rent Payment', amount: p.amount, isIncome: true, monthId: r.id })),
        ...r.manualFees.map(f => ({ ...f, type: 'Manual Fee', amount: -f.amount, isIncome: false, monthId: r.id })),
        ...r.adjustments.map(a => ({ ...a, type: `Adjustment (${a.reason})`, amount: a.amount, isIncome: a.amount >= 0, monthId: r.id })),
        ...(r.expenses || []).map(e => ({ ...e, type: `Tenant Exp - ${e.category}`, amount: -e.amount, isIncome: false, monthId: r.id }))
    ]).concat((data.propertyExpenses || []).map(e => ({ ...e, type: `Global Exp - ${e.category}`, amount: -e.amount, isIncome: false, monthId: '' })))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('ledger')} className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'ledger' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        <ArrowRightLeft size={16} /><span>Master Ledger</span>
                    </button>
                    <button onClick={() => setActiveTab('months')} className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'months' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Calendar size={16} /><span>Billing Cycles</span>
                    </button>
                </div>
            </div>

            {activeTab === 'ledger' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Note</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {allTransactions.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No transactions recorded.</td></tr>
                                ) : (
                                    allTransactions.map((t, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(t.date)}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="font-semibold text-gray-900">{t.type}</div>
                                                <div className="text-gray-500 text-xs">{(t as any).note || (t as any).description || '-'}</div>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${t.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.isIncome ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {t.monthId ? (
                                                    <Link to={`/month/${t.monthId}`} className="text-blue-500 hover:text-blue-700 text-xs font-medium border border-blue-200 bg-blue-50 px-3 py-1 rounded-full">Jump to Month</Link>
                                                ) : <span className="text-xs text-gray-400">Global</span>}
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
                        <div key={record.id} className="p-4 sm:px-6 hover:bg-gray-50 transition flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center space-x-4 w-full sm:w-auto">
                            <div className={`p-2 rounded-full ${record.stats.isPaidOff ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {record.stats.isPaidOff ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900">{MONTH_NAMES[record.month - 1]} {record.year}</h4>
                                <p className="text-sm text-gray-500">Due: {record.dueDate}</p>
                            </div>
                            </div>

                            <div className="flex items-center justify-between w-full sm:w-auto gap-8">
                            <div className="text-right">
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
