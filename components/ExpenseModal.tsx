import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { FileUpload } from './FileUpload';
import { formatCurrency } from '../utils/calculations';
import { Plus, Trash2, Paperclip } from 'lucide-react';
import { Expense } from '../types';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Omit<Expense, 'id'>) => void;
    initialData?: Expense | null;
    categories: string[] | undefined;
    title: string;
    showRecurringOption?: boolean;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ 
    isOpen, onClose, onSave, initialData, categories, title, showRecurringOption = true 
}) => {
    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [vendor, setVendor] = useState('');
    const [receiptUrl, setReceiptUrl] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringInterval, setRecurringInterval] = useState<'monthly' | 'yearly'>('monthly');

    // Split Transaction State
    const [isSplit, setIsSplit] = useState(false);
    const [splits, setSplits] = useState<{ amount: string, category: string, description: string }[]>([
        { amount: '', category: 'Mortgage Principal', description: '' },
        { amount: '', category: 'Mortgage Interest', description: '' },
        { amount: '', category: 'Property Taxes', description: '' }
    ]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setDate(initialData.date);
                setAmount(initialData.amount.toString());
                setCategory(initialData.category);
                setDescription(initialData.description);
                setVendor(initialData.vendor || '');
                setReceiptUrl(initialData.receiptUrl || '');
                setIsRecurring(initialData.isRecurring || false);
                setRecurringInterval(initialData.recurringInterval || 'monthly');
                setIsSplit(initialData.isSplit || false);
                setSplits(initialData.splits ? initialData.splits.map((s: any) => ({ ...s, amount: s.amount.toString(), description: s.description || '' })) : [
                    { amount: '', category: 'Mortgage Principal', description: '' },
                    { amount: '', category: 'Mortgage Interest', description: '' }
                ]);
            } else {
                setDate(new Date().toISOString().split('T')[0]);
                setAmount('');
                setCategory('');
                setDescription('');
                setVendor('');
                setReceiptUrl('');
                setIsRecurring(false);
                setRecurringInterval('monthly');
                setIsSplit(false);
                setSplits([
                    { amount: '', category: 'Mortgage Principal', description: '' },
                    { amount: '', category: 'Mortgage Interest', description: '' },
                    { amount: '', category: 'Property Taxes', description: '' }
                ]);
            }
        }
    }, [isOpen, initialData]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        let finalAmount = parseFloat(amount);
        let finalCategory = category;
        let finalSplits = undefined;

        if (isSplit) {
            finalAmount = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
            finalCategory = 'Split Transaction';
            finalSplits = splits.map(s => ({
                amount: parseFloat(s.amount) || 0,
                category: s.category || 'Uncategorized',
                description: s.description
            }));
        }

        onSave({
            date,
            amount: finalAmount || 0,
            category: finalCategory,
            description,
            vendor,
            receiptUrl,
            isRecurring: showRecurringOption ? isRecurring : false,
            recurringInterval: (showRecurringOption && isRecurring) ? recurringInterval : undefined,
            isSplit,
            splits: finalSplits
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-xl">
            <form onSubmit={handleSave} className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Vendor / Payee</label>
                        <input type="text" value={vendor} onChange={e => setVendor(e.target.value)} className="mt-1 block w-full border rounded-md p-2" placeholder="e.g. Home Depot" />
                    </div>
                </div>

                <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 bg-purple-50 p-3 rounded-lg border border-purple-100 cursor-pointer hover:bg-purple-100 transition">
                        <input type="checkbox" checked={isSplit} onChange={e => setIsSplit(e.target.checked)} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                        <span className="text-purple-900 font-semibold">Split Transaction (e.g. Mortgage PITI)</span>
                    </label>
                </div>

                {!isSplit ? (
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                            <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full border rounded-md p-2" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} required className="mt-1 block w-full border rounded-md p-2 bg-white">
                                <option value="" disabled>Select Category...</option>
                                {categories?.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                                <option value="Mortgage Interest">Mortgage Interest</option>
                                <option value="Property Taxes">Property Taxes</option>
                                <option value="Insurance">Insurance</option>
                                <option value="Property Management">Property Management</option>
                                <option value="Repairs">Repairs</option>
                                <option value="Utilities">Utilities</option>
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 bg-gray-50 p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center"> Split Items </label>
                            <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-full border shadow-sm">
                                Total: {formatCurrency(splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0))}
                            </span>
                        </div>
                        {splits.map((split, idx) => (
                            <div key={idx} className="flex space-x-2 items-start bg-white p-2 rounded border">
                                <div className="flex-1 space-y-2">
                                    <input type="text" placeholder="Category" value={split.category} onChange={e => {
                                        const newSplits = [...splits]; newSplits[idx].category = e.target.value; setSplits(newSplits);
                                    }} className="block w-full border-b border-gray-200 focus:border-blue-500 focus:ring-0 px-1 py-1 text-sm bg-transparent" required />
                                    <input type="text" placeholder="Description (Optional)" value={split.description} onChange={e => {
                                        const newSplits = [...splits]; newSplits[idx].description = e.target.value; setSplits(newSplits);
                                    }} className="block w-full border-none focus:ring-0 px-1 py-1 text-xs text-gray-500 bg-transparent" />
                                </div>
                                <div className="w-28 relative">
                                    <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                                    <input type="number" step="0.01" placeholder="0.00" value={split.amount} onChange={e => {
                                        const newSplits = [...splits]; newSplits[idx].amount = e.target.value; setSplits(newSplits);
                                    }} className="block w-full border rounded-md py-1.5 pl-6 pr-2 text-sm" required />
                                </div>
                                <button type="button" onClick={() => setSplits(splits.filter((_, i) => i !== idx))} className="mt-1.5 p-1 text-red-400 hover:text-red-700 hover:bg-red-50 rounded">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setSplits([...splits, { amount: '', category: '', description: '' }])} className="text-sm text-blue-600 font-medium flex items-center pt-2 hover:text-blue-800">
                            <Plus size={14} className="mr-1" /> Add Split Line
                        </button>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input type="text" required value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full border rounded-md p-2" placeholder="Details of the expense" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Receipt Link (URL)</label>
                    <div className="flex mt-1 mb-4 shadow-sm">
                        <div className="flex-none bg-gray-100 px-3 py-2 border border-r-0 border-gray-300 rounded-l-md text-gray-500 flex items-center">
                            <Paperclip size={18} />
                        </div>
                        <input type="url" value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} className="block w-full border border-gray-300 rounded-r-md p-2 flex-1 focus:ring-blue-500 focus:border-blue-500" placeholder="https://" />
                    </div>
                    <FileUpload 
                        bucket="receipts"
                        onUploadComplete={(url) => setReceiptUrl(url)}
                    />
                </div>

                {showRecurringOption && (
                    <div className="bg-gray-50 p-4 border rounded-md flex items-start space-x-3">
                        <div className="flex items-center h-5">
                            <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        </div>
                        <div className="flex-1 text-sm">
                            <label className="font-medium text-gray-700">Recurring Expense</label>
                            <p className="text-gray-500 mb-2">Automatically post this expense going forward.</p>
                            {isRecurring && (
                                <select value={recurringInterval} onChange={e => setRecurringInterval(e.target.value as any)} className="block w-full border rounded-md p-2 text-sm mt-2">
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            )}
                        </div>
                    </div>
                )}

                <div className="pt-2">
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                        {initialData ? 'Update Expense' : 'Save Expense'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
