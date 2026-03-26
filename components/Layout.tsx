import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Settings, FileText, Building2, ArrowRightLeft, FolderOpen, Plus, DollarSign, Receipt, MinusCircle, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { Modal } from './Modal';
import { ExpenseModal } from './ExpenseModal';
import { GlobalEditModals } from './GlobalEditModals';

const NavItem = ({ to, icon: Icon, label, active }: any) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC = () => {
  const location = useLocation();
  const { data, addGlobalPayment, addGlobalFee, addGlobalExpense } = useStore();
  
  // FAB State
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'fee' | 'expense' | null>(null);

  // Income Form
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  // Fee Form
  const [feeDate, setFeeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [feeAmount, setFeeAmount] = useState('');
  const [feeCategory, setFeeCategory] = useState('');
  const [feeDesc, setFeeDesc] = useState('');

  const defaultRent = data.records.length > 0 ? data.records[0].monthlyRent : 1500;

  const handleIncomeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addGlobalPayment({ date: payDate, amount: parseFloat(payAmount), note: payNote }, defaultRent);
      setModalType(null); setPayAmount(''); setPayNote('');
  };

  const handleFeeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addGlobalFee({ date: feeDate, amount: parseFloat(feeAmount), category: feeCategory, description: feeDesc }, defaultRent);
      setModalType(null); setFeeAmount(''); setFeeDesc(''); setFeeCategory('');
  };

  const handleExpenseSubmit = (expenseData: any) => {
      addGlobalExpense(expenseData, defaultRent);
      setModalType(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10 no-print">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2 text-blue-600">
            <LayoutDashboard size={28} />
            <span className="text-xl font-bold tracking-tight text-gray-900">PropTracker</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem 
            to="/" 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={location.pathname === '/'} 
          />
          <NavItem 
            to="/properties" 
            icon={Building2} 
            label="Properties & Leases" 
            active={location.pathname === '/properties'} 
          />
          <NavItem 
            to="/transactions" 
            icon={ArrowRightLeft} 
            label="Transactions" 
            active={location.pathname === '/transactions'} 
          />
          <NavItem 
             to="/documents" 
             icon={FolderOpen} 
             label="Document Vault" 
             active={location.pathname === '/documents'} 
           />
          <NavItem 
            to="/reports" 
            icon={FileText} 
            label="Reports" 
            active={location.pathname === '/reports'} 
          />
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Management
          </div>
          <NavItem 
            to="/settings" 
            icon={Settings} 
            label="Settings" 
            active={location.pathname === '/settings'} 
          />
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Account
          </div>
          <button
            onClick={async () => {
              const { supabase } = await import('../services/supabaseClient');
              await supabase?.auth.signOut();
              window.location.reload();
            }}
            className="flex w-full items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="font-medium">Sign Out</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            &copy; 2026 Rental Tracker
          </div>
        </div>
      </aside>

      {/* Mobile Header (Visible only on small screens) */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-20 p-4 flex items-center justify-between no-print">
         <span className="text-xl font-bold text-gray-900">PropTracker</span>
         <div className="flex space-x-4 text-gray-500">
            <Link to="/"><LayoutDashboard size={20}/></Link>
            <Link to="/transactions"><ArrowRightLeft size={20}/></Link>
            <Link to="/settings"><Settings size={20}/></Link>
         </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto min-h-screen">
        <div className="max-w-6xl mx-auto pb-24">
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 no-print flex flex-col items-end">
         {/* Dropdown Menu */}
         {isFabOpen && (
             <div className="bg-white rounded-xl shadow-2xl border border-gray-100 mb-4 p-2 w-56 flex flex-col gap-1 animate-in slide-in-from-bottom-5">
                 <button onClick={() => { setModalType('income'); setIsFabOpen(false); }} className="flex items-center space-x-3 w-full p-3 hover:bg-green-50 rounded-lg text-left text-green-700 font-medium transition">
                     <DollarSign size={18} /><span>Record Income</span>
                 </button>
                 <button onClick={() => { setModalType('expense'); setIsFabOpen(false); }} className="flex items-center space-x-3 w-full p-3 hover:bg-orange-50 rounded-lg text-left text-orange-700 font-medium transition">
                     <Receipt size={18} /><span>Log Expense</span>
                 </button>
                 <button onClick={() => { setModalType('fee'); setIsFabOpen(false); }} className="flex items-center space-x-3 w-full p-3 hover:bg-red-50 rounded-lg text-left text-red-700 font-medium transition">
                     <MinusCircle size={18} /><span>Add Custom Fee</span>
                 </button>
             </div>
         )}
         
         <button onClick={() => setIsFabOpen(!isFabOpen)} className={`p-4 rounded-full shadow-xl transition-all duration-300 transform ${isFabOpen ? 'bg-gray-800 rotate-45' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'} text-white`}>
             <Plus size={28} />
         </button>
      </div>

      {/* Global Modals */}
      <Modal isOpen={modalType === 'income'} onClose={() => setModalType(null)} title="Record Global Income">
         <form onSubmit={handleIncomeSubmit} className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
                <input type="date" required value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full border-gray-300 rounded-lg p-2.5 border" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input type="number" step="0.01" required value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full border-gray-300 rounded-lg p-2.5 border" placeholder="1500.00" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)} className="w-full border-gray-300 rounded-lg p-2.5 border" placeholder="e.g. Cleared Check #1042" />
             </div>
             <button type="submit" className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 font-medium mt-2">Log Income</button>
         </form>
      </Modal>

      <Modal isOpen={modalType === 'fee'} onClose={() => setModalType(null)} title="Add Custom Fee">
         <form onSubmit={handleFeeSubmit} className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Assessed</label>
                <input type="date" required value={feeDate} onChange={e => setFeeDate(e.target.value)} className="w-full border-gray-300 rounded-lg p-2.5 border" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input type="number" step="0.01" required value={feeAmount} onChange={e => setFeeAmount(e.target.value)} className="w-full border-gray-300 rounded-lg p-2.5 border" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={feeCategory} onChange={e => setFeeCategory(e.target.value)} className="w-full border-gray-300 rounded-lg p-2.5 border">
                  <option value="">Select Category...</option>
                  {data.settings.feeCategories?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" required value={feeDesc} onChange={e => setFeeDesc(e.target.value)} className="w-full border-gray-300 rounded-lg p-2.5 border" placeholder="e.g. HOA Violation fine" />
             </div>
             <button type="submit" className="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 font-medium mt-2">Add Fee</button>
         </form>
      </Modal>

      <ExpenseModal
          isOpen={modalType === 'expense'}
          onClose={() => setModalType(null)}
          onSave={handleExpenseSubmit}
          initialData={null}
          categories={data.settings.expenseCategories}
          title="Log Global Expense"
          showRecurringOption={true}
      />
      
      <GlobalEditModals />
    </div>
  );
};