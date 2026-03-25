import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { calculateMonthStats, formatCurrency, formatDate } from '../utils/calculations';
import { MONTH_NAMES } from '../constants';
import { ArrowLeft, Trash2, Plus, FileText, Edit2, Link as LinkIcon } from 'lucide-react';
import { Modal } from '../components/Modal';
import { ExpenseModal } from '../components/ExpenseModal';
import { Expense } from '../types';

export const MonthDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, getMonth, deleteMonth, updateMonthRent, setLateFeeOverride, addPayment, editPayment, deletePayment, addFee, editFee, deleteFee, addAdjustment, editAdjustment, deleteAdjustment, addExpense, editExpense, deleteExpense, addNotice, editNotice, deleteNotice } = useStore();
  
  const record = getMonth(id || '');

  // Form States
  const [modalType, setModalType] = useState<'payment' | 'fee' | 'adjustment' | 'editRent' | 'overrideLateFee' | 'expense' | 'notice' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payNote, setPayNote] = useState('');

  // Fee Form
  const [feeAmount, setFeeAmount] = useState('');
  const [feeDate, setFeeDate] = useState('');
  const [feeCategory, setFeeCategory] = useState('');
  const [feeDesc, setFeeDesc] = useState('');

  // Adjustment Form
  const [adjAmount, setAdjAmount] = useState('');
  const [adjDate, setAdjDate] = useState('');
  const [adjReason, setAdjReason] = useState('');

  // Edit Rent Form
  const [editRentAmount, setEditRentAmount] = useState(0);
  const [editDueDate, setEditDueDate] = useState('');

  // Override Late Fee Form
  const [overrideLateFeeAmount, setOverrideLateFeeAmount] = useState('');

  // Expense Form
  const [editExpenseData, setEditExpenseData] = useState<Expense | null>(null);

  // Notice Form
  const [noticeDate, setNoticeDate] = useState('');
  const [noticeType, setNoticeType] = useState('');
  const [noticeDesc, setNoticeDesc] = useState('');
  const [noticeStatus, setNoticeStatus] = useState<'Served' | 'Expired' | 'Resolved'>('Served');

  const stats = useMemo(() => record ? calculateMonthStats(record) : null, [record]);

  if (!record || !stats) {
    return <div className="p-8 text-center text-gray-500">Record not found.</div>;
  }

  const handleDeleteMonth = () => {
    deleteMonth(record.id);
    navigate('/');
  };

  const openRentModal = () => {
      setEditRentAmount(record.monthlyRent);
      setEditDueDate(record.dueDate);
      setModalType('editRent');
  };

  const handleRentUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      updateMonthRent(record.id, editRentAmount, editDueDate);
      setModalType(null);
  };

  const handleOverrideLateFee = (e: React.FormEvent) => {
      e.preventDefault();
      if (overrideLateFeeAmount === '') {
        setLateFeeOverride(record.id, undefined);
      } else {
        setLateFeeOverride(record.id, parseFloat(overrideLateFeeAmount));
      }
      setModalType(null);
  };

  const resetForms = () => {
    setModalType(null);
    setEditingId(null);
    setPayAmount(''); setPayDate(''); setPayNote('');
    setFeeAmount(''); setFeeDate(''); setFeeCategory(''); setFeeDesc('');
    setAdjAmount(''); setAdjDate(''); setAdjReason('');
    setEditExpenseData(null);
    setNoticeDate(''); setNoticeType(''); setNoticeDesc(''); setNoticeStatus('Served');
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      editPayment(record.id, { id: editingId, date: payDate, amount: parseFloat(payAmount), note: payNote });
    } else {
      addPayment(record.id, { date: payDate, amount: parseFloat(payAmount), note: payNote });
    }
    resetForms();
  };

  const handleAddFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      editFee(record.id, { id: editingId, date: feeDate, amount: parseFloat(feeAmount), category: feeCategory, description: feeDesc });
    } else {
      addFee(record.id, { date: feeDate, amount: parseFloat(feeAmount), category: feeCategory, description: feeDesc });
    }
    resetForms();
  };

  const handleAddAdj = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      editAdjustment(record.id, { id: editingId, date: adjDate, amount: parseFloat(adjAmount), reason: adjReason });
    } else {
      addAdjustment(record.id, { date: adjDate, amount: parseFloat(adjAmount), reason: adjReason });
    }
    resetForms();
  };

  const handleSaveExpense = (expenseData: Omit<Expense, 'id'>) => {
    if (editExpenseData) {
      editExpense(record.id, { id: editExpenseData.id, ...expenseData });
    } else {
      addExpense(record.id, expenseData);
    }
    setModalType(null);
  };

  const openEditPayment = (p: any) => {
    setEditingId(p.id);
    setPayAmount(p.amount.toString());
    setPayDate(p.date);
    setPayNote(p.note || '');
    setModalType('payment');
  };

  const openEditFee = (f: any) => {
    setEditingId(f.id);
    setFeeAmount(f.amount.toString());
    setFeeDate(f.date);
    setFeeCategory(f.category || '');
    setFeeDesc(f.description || '');
    setModalType('fee');
  };

  const openEditAdjustment = (a: any) => {
    setEditingId(a.id);
    setAdjAmount(a.amount.toString());
    setAdjDate(a.date);
    setAdjReason(a.reason || '');
    setModalType('adjustment');
  };

  const openEditExpense = (e: any) => {
    setEditExpenseData(e);
    setModalType('expense');
  };

  const openEditNotice = (n: any) => {
    setEditingId(n.id);
    setNoticeDate(n.date);
    setNoticeType(n.type || '');
    setNoticeDesc(n.notes || '');
    setNoticeStatus(n.status || 'Served');
    setModalType('notice');
  };

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      editNotice(record.id, { id: editingId, date: noticeDate, type: noticeType, notes: noticeDesc, status: noticeStatus });
    } else {
      addNotice(record.id, { date: noticeDate, type: noticeType, notes: noticeDesc, status: noticeStatus });
    }
    resetForms();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {MONTH_NAMES[record.month - 1]} {record.year}
            </h1>
            <p className="text-sm text-gray-500">
               Due Date: {formatDate(record.dueDate)} | Status: 
               <span className={`ml-1 font-medium ${stats.isPaidOff ? 'text-green-600' : 'text-red-600'}`}>
                 {stats.isPaidOff ? 'Paid' : `Outstanding (${stats.daysLate} days late)`}
               </span>
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
            <button onClick={openRentModal} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Edit Rent
            </button>
            <Link to={`/statement/${record.id}`} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                <FileText size={16} />
                <span>Statement</span>
            </Link>
            <button onClick={handleDeleteMonth} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
                <Trash2 size={16} />
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <span className="text-xs font-semibold text-blue-600 uppercase">Rent</span>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(record.monthlyRent)}</div>
            {stats.rentOwed > 0 && <div className="text-xs text-red-500 mt-1 font-medium">Owed: {formatCurrency(stats.rentOwed)}</div>}
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100 relative group">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-red-600 uppercase">Late Fees</span>
              <button 
                onClick={() => {
                  setOverrideLateFeeAmount(record.lateFeeOverride !== undefined ? record.lateFeeOverride.toString() : '');
                  setModalType('overrideLateFee');
                }} 
                className="text-xs text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Override
              </button>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalLateFees)}
              {record.lateFeeOverride !== undefined && <span className="text-xs text-red-500 ml-2 font-normal">(Overridden)</span>}
            </div>
            <div className="text-xs text-red-500 mt-1 flex flex-col gap-0.5">
              {record.lateFeeOverride === undefined && (
                <span>Flat: {formatCurrency(stats.flatLateFee)} | Daily: {formatCurrency(stats.dailyLateFee)}</span>
              )}
              {stats.lateFeesOwed > 0 && <span className="font-medium">Owed: {formatCurrency(stats.lateFeesOwed)}</span>}
            </div>
        </div>
         <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <span className="text-xs font-semibold text-green-600 uppercase">Paid</span>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPayments)}</div>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
            <span className="text-xs font-semibold text-gray-600 uppercase">Balance Due</span>
            <div className={`text-2xl font-bold ${stats.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(stats.remainingBalance)}
            </div>
            {stats.remainingBalance > 0 && (
              <div className="text-xs text-gray-500 mt-1 flex gap-2 flex-wrap">
                {stats.rentOwed > 0 && <span>Rent: {formatCurrency(stats.rentOwed)}</span>}
                {stats.lateFeesOwed > 0 && <span>Late: {formatCurrency(stats.lateFeesOwed)}</span>}
                {stats.evictionFeesOwed > 0 && <span>Eviction: {formatCurrency(stats.evictionFeesOwed)}</span>}
                {stats.otherFeesOwed > 0 && <span>Other: {formatCurrency(stats.otherFeesOwed)}</span>}
              </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Payments Section */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Payments</h2>
                <button onClick={() => { resetForms(); setModalType('payment'); }} className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center space-x-1">
                    <Plus size={14} /> <span>Add</span>
                </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {record.payments.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">No payments recorded</td></tr>
                        ) : (
                            record.payments.map(p => (
                                <tr key={p.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(p.date)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{p.note || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatCurrency(p.amount)}</td>
                                    <td className="px-4 py-3 text-right space-x-3 flex justify-end items-center">
                                        <Link to={`/receipt/${record.id}/${p.id}`} className="text-gray-400 hover:text-gray-600 w-4 h-4" title="Generate Receipt">
                                            <FileText size={14} />
                                        </Link>
                                        <button onClick={() => openEditPayment(p)} className="text-blue-400 hover:text-blue-600 w-4 h-4"><Edit2 size={14} /></button>
                                        <button onClick={() => deletePayment(record.id, p.id)} className="text-red-400 hover:text-red-600 w-4 h-4"><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Fees & Adjustments Section */}
        <div className="space-y-8">
             {/* Manual Fees */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Manual Fees</h2>
                    <button onClick={() => { resetForms(); setModalType('fee'); }} className="text-sm bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 flex items-center space-x-1">
                        <Plus size={14} /> <span>Add</span>
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desc</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {record.manualFees.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">No manual fees</td></tr>
                            ) : (
                                record.manualFees.map(f => (
                                    <tr key={f.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(f.date)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{f.category || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{f.description}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(f.amount)}</td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <button onClick={() => openEditFee(f)} className="text-blue-400 hover:text-blue-600"><Edit2 size={14} /></button>
                                            <button onClick={() => deleteFee(record.id, f.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* Adjustments */}
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Adjustments</h2>
                    <button onClick={() => { resetForms(); setModalType('adjustment'); }} className="text-sm bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 flex items-center space-x-1">
                        <Plus size={14} /> <span>Add</span>
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {record.adjustments.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">No adjustments</td></tr>
                            ) : (
                                record.adjustments.map(a => (
                                    <tr key={a.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(a.date)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{a.reason}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(a.amount)}</td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <button onClick={() => openEditAdjustment(a)} className="text-blue-400 hover:text-blue-600"><Edit2 size={14} /></button>
                                            <button onClick={() => deleteAdjustment(record.id, a.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expenses */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Tenant Expenses (Paid by Landlord)</h2>
                    <button onClick={() => { resetForms(); setModalType('expense'); }} className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 flex items-center space-x-1">
                        <Plus size={14} /> <span>Add Expense</span>
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {record.expenses?.length === 0 || !record.expenses ? (
                                <tr><td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">No tenant expenses recorded</td></tr>
                            ) : (
                                record.expenses.map(expense => (
                                    <tr key={expense.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(expense.date)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
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
                                        <td className="px-4 py-3 text-sm text-gray-500">{expense.vendor || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {expense.receiptUrl ? (
                                                <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                                                    <LinkIcon size={14} /> <span>Link</span>
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-red-600">
                                            {formatCurrency(expense.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <button onClick={() => openEditExpense(expense)} className="text-blue-400 hover:text-blue-600"><Edit2 size={14} /></button>
                                            <button onClick={() => deleteExpense(record.id, expense.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notices */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Legal Notices</h2>
                    <button onClick={() => { resetForms(); setModalType('notice'); }} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex items-center space-x-1">
                        <Plus size={14} /> <span>Add</span>
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desc</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {record.notices?.length === 0 || !record.notices ? (
                                <tr><td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">No notices</td></tr>
                            ) : (
                                record.notices.map(n => (
                                    <tr key={n.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(n.date)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{n.type}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{n.notes}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            <span className={`px-2 py-1 text-xs rounded-full ${n.status === 'Served' ? 'bg-yellow-100 text-yellow-800' : n.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {n.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <button onClick={() => openEditNotice(n)} className="text-blue-400 hover:text-blue-600"><Edit2 size={14} /></button>
                                            <button onClick={() => deleteNotice(record.id, n.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

      </div>

      {/* Modals */}
      <Modal isOpen={modalType === 'payment'} onClose={resetForms} title={editingId ? "Edit Payment" : "Record Payment"}>
         <form onSubmit={handleAddPayment} className="space-y-3">
             <input type="date" required value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full border p-2 rounded" placeholder="Date" />
             <input type="number" step="0.01" required value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full border p-2 rounded" placeholder="Amount ($)" />
             <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)} className="w-full border p-2 rounded" placeholder="Note (e.g. Check #123)" />
             <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">{editingId ? "Save Changes" : "Add Payment"}</button>
         </form>
      </Modal>

      <Modal isOpen={modalType === 'fee'} onClose={resetForms} title={editingId ? "Edit Manual Fee" : "Add Manual Fee"}>
         <form onSubmit={handleAddFee} className="space-y-3">
             <input type="date" required value={feeDate} onChange={e => setFeeDate(e.target.value)} className="w-full border p-2 rounded" />
             <input type="number" step="0.01" required value={feeAmount} onChange={e => setFeeAmount(e.target.value)} className="w-full border p-2 rounded" placeholder="Amount ($)" />
             <select value={feeCategory} onChange={e => setFeeCategory(e.target.value)} className="w-full border p-2 rounded">
                 <option value="">Select Category (Optional)</option>
                 {data.settings.feeCategories?.map(cat => (
                     <option key={cat} value={cat}>{cat}</option>
                 ))}
             </select>
             <input type="text" required value={feeDesc} onChange={e => setFeeDesc(e.target.value)} className="w-full border p-2 rounded" placeholder="Description (e.g. Eviction Fee)" />
             <button type="submit" className="w-full bg-orange-600 text-white p-2 rounded hover:bg-orange-700">{editingId ? "Save Changes" : "Add Fee"}</button>
         </form>
      </Modal>

      <Modal isOpen={modalType === 'adjustment'} onClose={resetForms} title={editingId ? "Edit Adjustment" : "Add Adjustment"}>
         <form onSubmit={handleAddAdj} className="space-y-3">
             <input type="date" required value={adjDate} onChange={e => setAdjDate(e.target.value)} className="w-full border p-2 rounded" />
             <input type="number" step="0.01" required value={adjAmount} onChange={e => setAdjAmount(e.target.value)} className="w-full border p-2 rounded" placeholder="Amount ($) - Negative for credit" />
             <input type="text" required value={adjReason} onChange={e => setAdjReason(e.target.value)} className="w-full border p-2 rounded" placeholder="Reason" />
             <button type="submit" className="w-full bg-gray-600 text-white p-2 rounded hover:bg-gray-700">{editingId ? "Save Changes" : "Add Adjustment"}</button>
         </form>
      </Modal>

      <ExpenseModal
          isOpen={modalType === 'expense'}
          onClose={() => setModalType(null)}
          onSave={handleSaveExpense}
          initialData={editExpenseData}
          categories={data.settings.expenseCategories}
          title={editExpenseData ? "Edit Tenant Expense" : "Add Tenant Expense (Paid by Landlord)"}
          showRecurringOption={false}
      />

      <Modal isOpen={modalType === 'notice'} onClose={resetForms} title={editingId ? "Edit Legal Notice" : "Add Legal Notice"}>
         <form onSubmit={handleAddNotice} className="space-y-3">
             <input type="date" required value={noticeDate} onChange={e => setNoticeDate(e.target.value)} className="w-full border p-2 rounded" />
             <input type="text" required value={noticeType} onChange={e => setNoticeType(e.target.value)} className="w-full border p-2 rounded" placeholder="Type (e.g., 3-Day Pay or Quit)" />
             <input type="text" value={noticeDesc} onChange={e => setNoticeDesc(e.target.value)} className="w-full border p-2 rounded" placeholder="Description" />
             <select value={noticeStatus} onChange={e => setNoticeStatus(e.target.value as any)} className="w-full border p-2 rounded">
                 <option value="Served">Served</option>
                 <option value="Expired">Expired</option>
                 <option value="Resolved">Resolved</option>
             </select>
             <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">{editingId ? "Save Changes" : "Add Notice"}</button>
         </form>
      </Modal>

      <Modal isOpen={modalType === 'editRent'} onClose={() => setModalType(null)} title="Edit Monthly Rent">
         <form onSubmit={handleRentUpdate} className="space-y-3">
             <div>
                <label className="text-xs text-gray-500">Rent Amount</label>
                <input type="number" step="0.01" required value={editRentAmount} onChange={e => setEditRentAmount(parseFloat(e.target.value))} className="w-full border p-2 rounded" />
             </div>
             <div>
                <label className="text-xs text-gray-500">Due Date</label>
                <input type="date" required value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className="w-full border p-2 rounded" />
             </div>
             <div className="bg-yellow-50 text-yellow-800 p-2 text-xs rounded">
                Warning: Changing dates may affect calculated late fees.
             </div>
             <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Update Rent</button>
         </form>
      </Modal>

      <Modal isOpen={modalType === 'overrideLateFee'} onClose={() => setModalType(null)} title="Override Late Fee">
         <form onSubmit={handleOverrideLateFee} className="space-y-3">
             <div>
                <label className="text-xs text-gray-500">New Late Fee Amount (Leave blank to reset to auto-calculated)</label>
                <input type="number" step="0.01" value={overrideLateFeeAmount} onChange={e => setOverrideLateFeeAmount(e.target.value)} className="w-full border p-2 rounded" placeholder={`Auto calculated: ${formatCurrency(stats.flatLateFee + stats.dailyLateFee)}`} />
             </div>
             <button type="submit" className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700">Save Override</button>
         </form>
      </Modal>

    </div>
  );
};