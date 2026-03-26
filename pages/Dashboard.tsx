import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { Modal } from '../components/Modal';
import { calculateMonthStats, formatCurrency, formatDate } from '../utils/calculations';
import { Plus, ChevronRight, AlertCircle, CheckCircle, Upload, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { MONTH_NAMES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as Papa from 'papaparse';
import { ImportResult } from '../types';

export const Dashboard: React.FC = () => {
  const { data, leases, properties, tenants, addMonth, importData, setEditTarget } = useStore();
  const navigate = useNavigate();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [showOutstandingBreakdown, setShowOutstandingBreakdown] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [chartRange, setChartRange] = useState<'6m' | '12m' | 'ytd' | 'all'>('6m');
  const [selectedPropertyFilterId, setSelectedPropertyFilterId] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const latestRecord = data.records.length > 0 ? data.records[0] : null;

  const getNextMonth = () => {
    if (!latestRecord) return new Date().getMonth() + 1;
    return latestRecord.month === 12 ? 1 : latestRecord.month + 1;
  };

  const getNextYear = () => {
    if (!latestRecord) return new Date().getFullYear();
    return latestRecord.month === 12 ? latestRecord.year + 1 : latestRecord.year;
  };

  let activeLeases = leases?.filter(l => l.isActive) || [];
  
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>('');
  const [year, setYear] = useState(getNextYear());
  const [month, setMonth] = useState(getNextMonth());
  const [rent, setRent] = useState(latestRecord?.monthlyRent || 1500);
  const [dueDate, setDueDate] = useState(() => {
    const nextYear = getNextYear();
    const nextMonth = String(getNextMonth()).padStart(2, '0');
    return `${nextYear}-${nextMonth}-01`;
  });

  useEffect(() => {
    if (isAddModalOpen) {
      const nextYear = getNextYear();
      const nextMonth = getNextMonth();
      setYear(nextYear);
      setMonth(nextMonth);
      setDueDate(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01`);
      
      if (activeLeases.length > 0) {
          setSelectedLeaseId(activeLeases[0].id);
          setRent(activeLeases[0].monthlyRent);
      } else {
          setRent(latestRecord?.monthlyRent || 1500);
      }
    }
  }, [isAddModalOpen, latestRecord, activeLeases.length]);

  const handleAddMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate) return;
    addMonth(year, month, rent, dueDate, selectedLeaseId || undefined);
    setAddModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setImportError('Error parsing CSV. Please check the format.');
          return;
        }
        const result = importData(results.data);
        setImportResult(result);
        setImportError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => setImportError(error.message)
    });
  };

  const filteredRecords = useMemo(() => {
     if (selectedPropertyFilterId === 'all') return data.records;
     return data.records.filter(r => {
         if (!r.leaseId) return false;
         const lease = leases?.find(l => l.id === r.leaseId);
         return lease?.propertyId === selectedPropertyFilterId;
     });
  }, [data.records, leases, selectedPropertyFilterId]);

  const filteredPropertyExpenses = useMemo(() => {
     const exps = data.propertyExpenses || [];
     if (selectedPropertyFilterId === 'all') return exps;
     return exps.filter(e => e.propertyId === selectedPropertyFilterId);
  }, [data.propertyExpenses, selectedPropertyFilterId]);

  const stats = useMemo(() => filteredRecords.map(r => ({ ...r, stats: calculateMonthStats(r) })), [filteredRecords]);

  const totalOutstanding = stats.reduce((sum, r) => sum + r.stats.remainingBalance, 0);
  const totalRentOwed = stats.reduce((sum, r) => sum + r.stats.rentOwed, 0);
  const totalLateFeesOwed = stats.reduce((sum, r) => sum + r.stats.lateFeesOwed, 0);
  const totalEvictionFeesOwed = stats.reduce((sum, r) => sum + r.stats.evictionFeesOwed, 0);
  const totalOtherFeesOwed = stats.reduce((sum, r) => sum + r.stats.otherFeesOwed, 0);

  const totalCollected = stats.reduce((sum, r) => sum + r.stats.totalPayments, 0);
  const totalTenantExpenses = filteredRecords.reduce((sum, r) => sum + (r.expenses || []).reduce((s, e) => s + e.amount, 0), 0);
  const totalPropertyExpenses = filteredPropertyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netCashFlow = totalCollected - totalTenantExpenses - totalPropertyExpenses;

  const globalExpensesByMonth: Record<string, number> = {};
  filteredPropertyExpenses.forEach(e => {
     if (e.date) {
        const monthKey = e.date.substring(0, 7);
        globalExpensesByMonth[monthKey] = (globalExpensesByMonth[monthKey] || 0) + e.amount;
     }
  });

  const chartData = useMemo(() => {
    let baseStats = [...stats];
    if (chartRange === 'ytd') {
        const currentYear = new Date().getFullYear();
        baseStats = baseStats.filter(s => s.year === currentYear);
    } else if (chartRange === '6m') {
        baseStats = baseStats.slice(0, 6);
    } else if (chartRange === '12m') {
        baseStats = baseStats.slice(0, 12);
    }

    return baseStats.reverse().map(s => {
        const monthKey = `${s.year}-${String(s.month).padStart(2, '0')}`;
        const propertyExp = globalExpensesByMonth[monthKey] || 0;
        return {
            id: s.id,
            name: `${(MONTH_NAMES[s.month - 1] || '').substring(0, 3)} ${s.year}`,
            collected: s.stats.totalPayments,
            owed: s.stats.totalOwed,
            expenses: (s.expenses || []).reduce((sum, e) => sum + e.amount, 0) + propertyExp
        };
    });
  }, [stats, chartRange, globalExpensesByMonth]);

  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.id) {
      navigate(`/month/${data.activePayload[0].payload.id}`);
    }
  };

  const allTransactions = useMemo(() => {
    return filteredRecords.flatMap(r => [
      ...r.payments.map(p => ({ ...p, type: 'Rent Payment', amount: p.amount, isIncome: true, monthId: r.id, originalType: 'payment', item: p })),
      ...r.manualFees.map(f => ({ ...f, type: 'Manual Fee', amount: -f.amount, isIncome: false, monthId: r.id, originalType: 'fee', item: f })),
      ...r.adjustments.map(a => ({ ...a, type: `Adjustment (${a.reason})`, amount: a.amount, isIncome: a.amount >= 0, monthId: r.id, originalType: 'adjustment', item: a })),
      ...(r.expenses || []).map(e => ({ ...e, type: `Billable Exp - ${e.category}`, amount: -e.amount, isIncome: false, monthId: r.id, originalType: 'expense', item: e }))
    ]).concat(filteredPropertyExpenses.map(e => ({ ...e, type: `Property Exp - ${e.category}`, amount: -e.amount, isIncome: false, monthId: '', originalType: 'expense', item: e })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredRecords, filteredPropertyExpenses]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Overview of your rental property performance.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {properties && properties.length > 0 && (
              <select 
                  value={selectedPropertyFilterId} 
                  onChange={e => setSelectedPropertyFilterId(e.target.value)}
                  className="w-full sm:w-auto bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                  <option value="all">Entire Portfolio</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
          )}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button onClick={() => setImportModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition shadow-sm">
                <Upload size={18} /><span>Import CSV</span>
              </button>
              <button onClick={() => setAddModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
                <Plus size={18} /><span>New Month</span>
              </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowOutstandingBreakdown(!showOutstandingBreakdown)}>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-500">Total Outstanding</h3>
            {showOutstandingBreakdown ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
          <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(totalOutstanding)}</p>
          {showOutstandingBreakdown && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Rent Owed</span><span className="font-medium text-red-600">{formatCurrency(totalRentOwed)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Late Fees</span><span className="font-medium text-red-600">{formatCurrency(totalLateFeesOwed)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Eviction Fees</span><span className="font-medium text-red-600">{formatCurrency(totalEvictionFeesOwed)}</span></div>
              {totalOtherFeesOwed > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Other Fees</span><span className="font-medium text-red-600">{formatCurrency(totalOtherFeesOwed)}</span></div>}
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Total Collected</h3>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sm:col-span-2 md:col-span-1">
          <h3 className="text-sm font-medium text-gray-500">Net Cash Flow</h3>
          <p className={`text-3xl font-bold mt-2 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netCashFlow)}</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-semibold">Financial Overview <span className="text-sm font-normal text-gray-400 hidden sm:inline-block ml-2">(Click a bar for details)</span></h3>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setChartRange('6m')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${chartRange === '6m' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>6 Mos</button>
                <button onClick={() => setChartRange('12m')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${chartRange === '12m' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>12 Mos</button>
                <button onClick={() => setChartRange('ytd')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${chartRange === 'ytd' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>YTD</button>
                <button onClick={() => setChartRange('all')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${chartRange === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Max</button>
            </div>
          </div>
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} onClick={handleChartClick} style={{ cursor: 'pointer' }} margin={{ top: 0, left: -20, right: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="owed" name="Total Owed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <Link to="/transactions" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All &rarr;</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {allTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No recent transactions.</div>
          ) : (
            allTransactions.slice(0, 10).map((t, idx) => (
              <div key={idx} className="p-4 sm:px-6 hover:bg-gray-50 transition flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`p-2 rounded-full hidden sm:block ${t.isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {t.isIncome ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">{t.type}</h4>
                    <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`font-bold text-right ${t.isIncome ? 'text-green-600' : 'text-gray-900'}`}>
                    {t.isIncome ? '+' : ''}{formatCurrency(Math.abs(t.amount))}
                  </div>
                  <button 
                    onClick={() => setEditTarget({ type: t.originalType as any, item: t.item, monthId: t.monthId })}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 bg-gray-50 border border-gray-200 rounded-lg transition"
                    title="Edit Transaction"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Add Month Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Start New Month">
        <form onSubmit={handleAddMonth} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Month</label>
              <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white">
                {MONTH_NAMES.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Active Lease Contract</label>
            <select 
                value={selectedLeaseId} 
                onChange={e => {
                    const lId = e.target.value;
                    setSelectedLeaseId(lId);
                    const lease = activeLeases.find((l:any) => l.id === lId);
                    if (lease) setRent(lease.monthlyRent);
                }} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white"
            >
                <option value="">No Active Lease / Manual</option>
                {activeLeases.map((l:any) => {
                    const prop = properties?.find((p:any) => p.id === l.propertyId);
                    const ten = tenants?.find((t:any) => t.id === l.tenantId);
                    return <option key={l.id} value={l.id}>{prop?.name} ({ten?.name}) - ${l.monthlyRent}</option>;
                })}
            </select>
            {selectedLeaseId && <p className="text-xs text-blue-600 mt-1">Base rent synchronized to contract.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Override Base Rent ($)</label>
            <input type="number" value={rent} onChange={e => setRent(parseFloat(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            <p className="text-xs text-gray-500 mt-1">Leave as default unless calculating pro-rated move-in/out.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
          </div>
          <div className="pt-2">
            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium">Create Month Record</button>
          </div>
        </form>
      </Modal>

      {/* Import CSV Modal */}
      <Modal isOpen={isImportModalOpen} onClose={() => { setImportModalOpen(false); setImportError(''); setImportResult(null); }} title="Import Data">
        {importResult ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${importResult.rowsImported > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <h3 className="font-semibold text-gray-900">Import Complete</h3>
              <p className="text-sm text-gray-600">Processed {importResult.rowsProcessed} rows. Imported {importResult.rowsImported} items.</p>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2 bg-gray-50">
              {importResult.logs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">No logs generated.</p>
              ) : (
                importResult.logs.map((log, i) => (
                  <div key={i} className={`text-xs p-2 rounded border ${log.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
                    log.type === 'warning' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                      'bg-white border-gray-200 text-gray-600'
                    }`}>
                    <span className="font-semibold uppercase mr-2">{log.type}</span>
                    {log.row && <span className="text-gray-400 mr-2">Row {log.row}:</span>}
                    {log.message}
                  </div>
                ))
              )}
            </div>

            <button onClick={() => { setImportModalOpen(false); setImportResult(null); }} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload a CSV file to import rent, payments, fees, and adjustments. The file must have the following headers exactly:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="font-mono font-medium pb-2 pr-4">Date</th>
                    <th className="font-mono font-medium pb-2 pr-4">Category</th>
                    <th className="font-mono font-medium pb-2 pr-4">Description</th>
                    <th className="font-mono font-medium pb-2 pr-4">Charge</th>
                    <th className="font-mono font-medium pb-2 pr-4">Payment</th>
                    <th className="font-mono font-medium pb-2">Balance</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr>
                    <td className="pr-4">YYYY-MM-DD</td>
                    <td className="pr-4">Rent | Payment | Fee | Adjustment</td>
                    <td className="pr-4">Optional text</td>
                    <td className="pr-4">Number</td>
                    <td className="pr-4">Number</td>
                    <td>(Ignored)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-xs text-gray-500">
              <p><strong>Rent:</strong> Looks at the Charge column to set the monthly rent.</p>
              <p><strong>Payment:</strong> Looks at the Payment column to record a payment.</p>
              <p><strong>Fee/Adjustment:</strong> Looks at Charge or Payment columns to add line items.</p>
            </div>

            {importError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {importError}
              </div>
            )}

            <div className="pt-4">
              <label className="block w-full text-center bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer p-6 rounded-xl transition">
                <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                <span className="text-sm font-medium text-gray-600">Click to select CSV file</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />
              </label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};