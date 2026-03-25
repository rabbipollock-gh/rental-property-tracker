import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Modal } from '../components/Modal';
import { ExpenseModal } from '../components/ExpenseModal';
import { formatCurrency, formatDate } from '../utils/calculations';
import { Plus, Trash2, Edit2, Link as LinkIcon, RefreshCw, Paperclip } from 'lucide-react';
import { Expense } from '../types';

export const Expenses: React.FC = () => {
    const { data, addPropertyExpense, editPropertyExpense, deletePropertyExpense } = useStore();
    const { propertyExpenses = [] } = data;

    const [isModalOpen, setModalOpen] = useState(false);
    const [editExpenseData, setEditExpenseData] = useState<Expense | null>(null);

    const handleOpenAdd = () => {
        setEditExpenseData(null);
        setModalOpen(true);
    };

    const handleEdit = (expense: Expense) => {
        setEditExpenseData(expense);
        setModalOpen(true);
    };

    const handleSave = (expenseData: Omit<Expense, 'id'>) => {
        if (editExpenseData) {
            editPropertyExpense({ id: editExpenseData.id, ...expenseData });
        } else {
            addPropertyExpense(expenseData);
        }
        setModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Property Expenses</h1>
                    <p className="text-gray-500 text-sm mt-1">Track global property expenses like mortgages, taxes, and general repairs.</p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={18} />
                    <span>Add Expense</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {propertyExpenses.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No property expenses recorded yet.</td></tr>
                        ) : (
                            propertyExpenses.map(expense => (
                                <tr key={expense.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center space-x-2">
                                            {expense.isRecurring && <span title="Recurring Expense"><RefreshCw size={12} className="text-blue-500" /></span>}
                                            <span>{formatDate(expense.date)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        <div className="font-medium">
                                            {expense.isSplit && (
                                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full mr-2">SPLIT</span>
                                            )}
                                            {expense.category}
                                        </div>
                                        <div className="text-gray-500 text-xs">{expense.description}</div>
                                        {expense.isSplit && expense.splits && (
                                            <div className="mt-1 text-xs text-gray-400">
                                                {expense.splits.map(s => s.category).join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{expense.vendor || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {expense.receiptUrl ? (
                                            <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                                                <LinkIcon size={14} /> <span>Link</span>
                                            </a>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                                        {formatCurrency(expense.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <button onClick={() => handleEdit(expense)} className="text-blue-600 hover:text-blue-900"><Edit2 size={16} /></button>
                                        <button onClick={() => deletePropertyExpense(expense.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ExpenseModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                initialData={editExpenseData}
                categories={data.settings.expenseCategories}
                title={editExpenseData ? "Edit Property Expense" : "Add Property Expense"}
                showRecurringOption={true}
            />
        </div>
    );
};
