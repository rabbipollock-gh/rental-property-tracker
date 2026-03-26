import React, { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Modal } from './Modal';
import { ExpenseModal } from './ExpenseModal';
import { Payment, Fee, Adjustment, Expense } from '../types';

export const GlobalEditModals: React.FC = () => {
    const { 
        editTarget, setEditTarget, data,
        editPayment, editFee, editAdjustment, editExpense, editPropertyExpense 
    } = useStore();

    // Local state for forms
    const [payAmount, setPayAmount] = useState('');
    const [payDate, setPayDate] = useState('');
    const [payNote, setPayNote] = useState('');

    const [feeAmount, setFeeAmount] = useState('');
    const [feeDate, setFeeDate] = useState('');
    const [feeCategory, setFeeCategory] = useState('');
    const [feeDesc, setFeeDesc] = useState('');

    const [adjAmount, setAdjAmount] = useState('');
    const [adjDate, setAdjDate] = useState('');
    const [adjReason, setAdjReason] = useState('');

    // Pre-fill forms when editTarget changes
    useEffect(() => {
        if (!editTarget || !editTarget.item) return;

        const { type, item } = editTarget;
        if (type === 'payment') {
            const p = item as Payment;
            setPayAmount(p.amount.toString());
            setPayDate(p.date);
            setPayNote(p.note || '');
        } else if (type === 'fee') {
            const f = item as Fee;
            setFeeAmount(f.amount.toString());
            setFeeDate(f.date);
            setFeeCategory(f.category || '');
            setFeeDesc(f.description || '');
        } else if (type === 'adjustment') {
            const a = item as Adjustment;
            setAdjAmount(a.amount.toString());
            setAdjDate(a.date);
            setAdjReason(a.reason || '');
        }
    }, [editTarget]);

    if (!editTarget) return null;

    const close = () => setEditTarget(null);
    const mId = editTarget.monthId || '';
    const itemId = editTarget.item?.id || '';

    const handleSavePayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (mId) editPayment(mId, { id: itemId, date: payDate, amount: parseFloat(payAmount), note: payNote });
        close();
    };

    const handleSaveFee = (e: React.FormEvent) => {
        e.preventDefault();
        if (mId) editFee(mId, { id: itemId, date: feeDate, amount: parseFloat(feeAmount), category: feeCategory, description: feeDesc });
        close();
    };

    const handleSaveAdj = (e: React.FormEvent) => {
        e.preventDefault();
        if (mId) editAdjustment(mId, { id: itemId, date: adjDate, amount: parseFloat(adjAmount), reason: adjReason });
        close();
    };

    const handleSaveExpense = (expenseData: Omit<Expense, 'id'>) => {
        if (mId) {
            editExpense(mId, { id: itemId, ...expenseData });
        } else if (editPropertyExpense) {
            editPropertyExpense({ id: itemId, ...expenseData });
        }
        close();
    };

    return (
        <>
            <Modal isOpen={editTarget.type === 'payment'} onClose={close} title="Edit Payment">
                <form onSubmit={handleSavePayment} className="space-y-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                         <input type="date" required value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                         <input type="number" step="0.01" required value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                         <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 font-medium">Save Changes</button>
                </form>
            </Modal>

            <Modal isOpen={editTarget.type === 'fee'} onClose={close} title="Edit Manual Fee">
                <form onSubmit={handleSaveFee} className="space-y-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                         <input type="date" required value={feeDate} onChange={e => setFeeDate(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                         <input type="number" step="0.01" required value={feeAmount} onChange={e => setFeeAmount(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                         <select value={feeCategory} onChange={e => setFeeCategory(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border">
                            <option value="">Select Category...</option>
                            {data.settings.feeCategories?.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                         <input type="text" required value={feeDesc} onChange={e => setFeeDesc(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 font-medium">Save Changes</button>
                </form>
            </Modal>

            <Modal isOpen={editTarget.type === 'adjustment'} onClose={close} title="Edit Adjustment">
                <form onSubmit={handleSaveAdj} className="space-y-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                         <input type="date" required value={adjDate} onChange={e => setAdjDate(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                         <input type="number" step="0.01" required value={adjAmount} onChange={e => setAdjAmount(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border" placeholder="Negative applies credit" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                         <input type="text" required value={adjReason} onChange={e => setAdjReason(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 font-medium">Save Changes</button>
                </form>
            </Modal>

            {editTarget.type === 'expense' && (
                <ExpenseModal
                    isOpen={true}
                    onClose={close}
                    onSave={handleSaveExpense}
                    initialData={editTarget.item as Expense}
                    categories={data.settings.expenseCategories}
                    title="Edit Expense"
                    showRecurringOption={!mId} // Only global expenses can be recurring currently
                />
            )}
        </>
    );
};
