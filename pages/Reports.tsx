import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { calculateMonthStats, formatCurrency } from '../utils/calculations';
import { FileText, DollarSign, Scale, Calendar, Download, Mail } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { generatePDFBase64, sendEmailWithPDF } from '../utils/sharePDF';
import { EmailModal } from '../components/EmailModal';

type ReportType = 
  | 'rent-roll' | 'income-statement' | 'cash-flow' | 'balance-sheet' | 'general-ledger'
  | 'aging' | 'tenant-ledger' | 'payment-history' | 'outstanding-balances' | 'late-fees'
  | 'notices' | 'security-deposit' | 'trust-accounting';

export const Reports: React.FC = () => {
  const { data, updateSettings } = useStore();
  const [activeReport, setActiveReport] = useState<ReportType>('rent-roll');
  
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const stats = useMemo(() => {
    return data.records.map(r => ({
      ...r,
      stats: calculateMonthStats(r)
    }));
  }, [data.records]);

  // --- Helper Functions for Reports ---
  
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return false;
    return dateStr >= startDate && dateStr <= endDate;
  };

  // --- Report Renderers ---

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    const opt = {
      margin:       0.5,
      filename:     `${activeReport}-report.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  const handleEmailClick = async () => {
    const base64 = await generatePDFBase64('report-content', `${activeReport}-report.pdf`, 'portrait');
    setPdfBase64(base64);
    setShowEmailModal(true);
  };

  const emailDefaultMessage = `Please find the attached report for ${activeReport.replace('-', ' ')}.`;

  const handleSendEmailReport = async (toEmails: string, ccMyself: boolean, finalMessage: string) => {
    let finalRecipients = toEmails;
    if (ccMyself && data.settings.landlordEmail && !toEmails.includes(data.settings.landlordEmail)) {
        finalRecipients += `, ${data.settings.landlordEmail}`;
    }

    if (pdfBase64) {
      await sendEmailWithPDF(
          `${activeReport}-report.pdf`,
          `Rental Property Report: ${activeReport.replace('-', ' ')}`,
          finalMessage,
          pdfBase64,
          finalRecipients,
          data.settings.landlordEmail,
          data.settings.gmailAppPassword || ''
      );
    }
    setShowEmailModal(false);
  };

  const handleDownloadCSV = () => {
    const transactions: any[] = [];
    
    data.records.forEach(r => {
      r.payments.forEach(p => transactions.push({ date: p.date, type: 'Payment', category: 'Income', desc: p.note, amount: p.amount, record: r.id }));
      r.manualFees.forEach(f => transactions.push({ date: f.date, type: 'Fee', category: f.category || 'Fee', desc: f.description, amount: -f.amount, record: r.id }));
      r.adjustments.forEach(a => transactions.push({ date: a.date, type: 'Adjustment', category: 'Adjustment', desc: a.reason, amount: a.amount, record: r.id }));
      (r.expenses || []).forEach(e => {
          if (e.isSplit && e.splits) {
              e.splits.forEach(s => transactions.push({ date: e.date, type: 'Expense-Split (Tenant)', category: s.category, desc: s.description || e.description, amount: -s.amount, record: r.id }));
          } else {
              transactions.push({ date: e.date, type: 'Expense (Tenant)', category: e.category, desc: e.description, amount: -e.amount, record: r.id });
          }
      });
    });

    (data.propertyExpenses || []).forEach(e => {
        if (e.isSplit && e.splits) {
            e.splits.forEach(s => transactions.push({ date: e.date, type: 'Property Exp-Split', category: s.category, desc: s.description || e.description, amount: -s.amount, record: 'Global' }));
        } else {
            transactions.push({ date: e.date, type: 'Property Expense', category: e.category, desc: e.description, amount: -e.amount, record: 'Global' });
        }
    });

    transactions.sort((a, b) => a.date.localeCompare(b.date));
    const filtered = transactions.filter(t => isDateInRange(t.date));

    const csvContent = [
        ['Date', 'Type', 'Category', 'Description', 'Record', 'Amount (USD)'].join(','),
        ...filtered.map(t => [
            t.date,
            `"${t.type}"`,
            `"${(t.category || '').replace(/"/g, '""')}"`,
            `"${(t.desc || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            `"${t.record}"`,
            t.amount
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `General_Ledger_${startDate}_to_${endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderRentRoll = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Rent Roll</h3>
        <p className="text-sm text-gray-500 mb-4">Snapshot of current unit, tenant, rent amount, and lease dates.</p>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lease Dates</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deposit Held</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-900">{data.settings.propertyAddress || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-900">{data.settings.tenantName || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-500">
                  {data.settings.leaseStartDate || 'N/A'} to {data.settings.leaseEndDate || 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-900">
                  {data.records.length > 0 ? formatCurrency(data.records[data.records.length - 1].monthlyRent) : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-900">
                  {formatCurrency(data.settings.securityDepositHeld || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    // Income vs Expenses in date range
    let totalIncome = 0;
    let totalExpenses = 0;
    const incomeByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    data.records.forEach(r => {
      r.payments.forEach(p => {
        if (isDateInRange(p.date)) {
            totalIncome += p.amount;
            incomeByCategory['Tenant Rent/Payments'] = (incomeByCategory['Tenant Rent/Payments'] || 0) + p.amount;
        }
      });
      (r.expenses || []).forEach(e => {
        if (isDateInRange(e.date)) {
            totalExpenses += e.amount;
            if (e.isSplit && e.splits) {
                e.splits.forEach(s => {
                    expensesByCategory[s.category] = (expensesByCategory[s.category] || 0) + s.amount;
                });
            } else {
                expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
            }
        }
      });
    });

    (data.propertyExpenses || []).forEach(e => {
        if (isDateInRange(e.date)) {
            totalExpenses += e.amount;
            if (e.isSplit && e.splits) {
                e.splits.forEach(s => {
                    expensesByCategory[s.category] = (expensesByCategory[s.category] || 0) + s.amount;
                });
            } else {
                expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
            }
        }
    });

    const netIncome = totalIncome - totalExpenses;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Income Statement (P&L)</h3>
        <p className="text-sm text-gray-500 mb-4">Categorized breakdown of income and expenses.</p>
        
        <div className="bg-white border rounded-lg p-6 max-w-2xl">
          <h4 className="font-bold text-gray-900 border-b pb-2 mb-2">Income</h4>
          {Object.entries(incomeByCategory).map(([cat, amt]) => (
            <div key={cat} className="flex justify-between py-1 px-2 text-sm">
                <span className="text-gray-600">{cat}</span>
                <span className="text-green-600">{formatCurrency(amt)}</span>
            </div>
          ))}
          <div className="flex justify-between py-2 border-t mt-2">
            <span className="font-medium text-gray-700">Total Income</span>
            <span className="text-green-600 font-medium">{formatCurrency(totalIncome)}</span>
          </div>

          <h4 className="font-bold text-gray-900 border-b pb-2 mt-6 mb-2">Expenses</h4>
          {Object.entries(expensesByCategory).sort((a,b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} className="flex justify-between py-1 px-2 text-sm">
                <span className="text-gray-600">{cat}</span>
                <span className="text-red-600">{formatCurrency(amt)}</span>
            </div>
          ))}
          {Object.keys(expensesByCategory).length === 0 && (
             <div className="text-sm text-gray-400 italic py-1 px-2">No expenses recorded</div>
          )}
          <div className="flex justify-between py-2 border-t mt-2">
            <span className="font-medium text-gray-700">Total Expenses</span>
            <span className="text-red-600 font-medium">{formatCurrency(totalExpenses)}</span>
          </div>

          <div className="flex justify-between py-4 mt-6 bg-gray-50 px-4 rounded-lg">
            <span className="font-bold text-gray-900">Net Income</span>
            <span className={`font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netIncome)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderCashFlow = () => {
    // Similar to P&L for this simple app, but focuses on actual cash in/out
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Cash Flow Report</h3>
        <p className="text-sm text-gray-500 mb-4">Actual cash in/out for the selected period.</p>
        {renderIncomeStatement()}
        <p className="text-xs text-gray-400 mt-4">* Note: In this simplified model, Cash Flow mirrors the Income Statement as all tracked income/expenses are cash-basis.</p>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    const assets = data.settings.securityDepositHeld || 0; // Simplified
    const liabilities = data.settings.securityDepositHeld || 0;
    const equity = assets - liabilities;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Balance Sheet</h3>
        <p className="text-sm text-gray-500 mb-4">Assets, liabilities, and equity.</p>
        
        <div className="bg-white border rounded-lg p-6 max-w-2xl space-y-6">
          <div>
            <h4 className="font-bold text-gray-900 border-b pb-2 mb-2">Assets</h4>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Operating Cash (Simulated)</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Security Deposit Account</span>
              <span>{formatCurrency(assets)}</span>
            </div>
            <div className="flex justify-between py-2 font-medium border-t mt-2">
              <span>Total Assets</span>
              <span>{formatCurrency(assets)}</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 border-b pb-2 mb-2">Liabilities</h4>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Security Deposits Held</span>
              <span>{formatCurrency(liabilities)}</span>
            </div>
            <div className="flex justify-between py-2 font-medium border-t mt-2">
              <span>Total Liabilities</span>
              <span>{formatCurrency(liabilities)}</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 border-b pb-2 mb-2">Equity</h4>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Owner's Equity</span>
              <span>{formatCurrency(equity)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGeneralLedger = () => {
    const transactions: any[] = [];
    
    data.records.forEach(r => {
      r.payments.forEach(p => {
        if (isDateInRange(p.date)) transactions.push({ date: p.date, type: 'Payment', amount: p.amount, desc: p.note, monthId: r.id });
      });
      r.manualFees.forEach(f => {
        if (isDateInRange(f.date)) transactions.push({ date: f.date, type: 'Fee', amount: -f.amount, desc: f.description, monthId: r.id });
      });
      r.adjustments.forEach(a => {
        if (isDateInRange(a.date)) transactions.push({ date: a.date, type: 'Adjustment', amount: a.amount, desc: a.reason, monthId: r.id });
      });
      (r.expenses || []).forEach(e => {
        if (isDateInRange(e.date)) {
            if (e.isSplit && e.splits) {
                e.splits.forEach(s => transactions.push({ date: e.date, type: 'Expense-Split (Tenant)', amount: -s.amount, category: s.category, desc: s.description || e.description, monthId: r.id }));
            } else {
                transactions.push({ date: e.date, type: 'Expense (Tenant)', amount: -e.amount, category: e.category, desc: e.description, monthId: r.id });
            }
        }
      });
    });

    (data.propertyExpenses || []).forEach(e => {
        if (isDateInRange(e.date)) {
            if (e.isSplit && e.splits) {
                e.splits.forEach(s => transactions.push({ date: e.date, type: 'Property Exp-Split', amount: -s.amount, category: s.category, desc: s.description || e.description, monthId: 'Global' }));
            } else {
                transactions.push({ date: e.date, type: 'Property Expense', amount: -e.amount, category: e.category, desc: e.description, monthId: 'Global' });
            }
        }
    });

    transactions.sort((a, b) => a.date.localeCompare(b.date));

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">General Ledger</h3>
        <p className="text-sm text-gray-500 mb-4">Full transaction history for the selected period.</p>
        
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-3 text-center text-gray-500">No transactions found in this period.</td></tr>
              ) : (
                transactions.map((t, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-900">{t.date}</td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.type === 'Payment' ? 'bg-green-100 text-green-800' :
                        t.type === 'Expense' ? 'bg-red-100 text-red-800' :
                        t.type === 'Fee' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.desc || '-'}</td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-500">{t.monthId}</td>
                    <td className={`px-4 py-3 whitespace-normal break-words text-sm text-right font-medium ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(t.amount))} {t.amount < 0 ? '(Dr)' : '(Cr)'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAgingReport = () => {
    let current = 0;
    let days30 = 0;
    let days60 = 0;
    let days90 = 0;

    stats.forEach(r => {
      if (r.stats.remainingBalance > 0) {
        if (r.stats.daysLate <= 30) current += r.stats.remainingBalance;
        else if (r.stats.daysLate <= 60) days30 += r.stats.remainingBalance;
        else if (r.stats.daysLate <= 90) days60 += r.stats.remainingBalance;
        else days90 += r.stats.remainingBalance;
      }
    });

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Aging Report</h3>
        <p className="text-sm text-gray-500 mb-4">Outstanding balances categorized by days past due.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-sm text-gray-500 mb-1">0-30 Days</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(current)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-sm text-gray-500 mb-1">31-60 Days</div>
            <div className="text-xl font-bold text-orange-600">{formatCurrency(days30)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-sm text-gray-500 mb-1">61-90 Days</div>
            <div className="text-xl font-bold text-red-600">{formatCurrency(days60)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-sm text-gray-500 mb-1">90+ Days</div>
            <div className="text-xl font-bold text-red-800">{formatCurrency(days90)}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderTenantLedger = () => {
    // Chronological list of charges and payments with running balance
    const ledgerItems: any[] = [];
    
    stats.forEach(r => {
      // Add rent charge
      if (isDateInRange(r.dueDate)) {
        ledgerItems.push({ date: r.dueDate, type: 'Rent Charge', charge: r.monthlyRent, payment: 0, desc: `Rent for ${r.id}` });
      }
      
      r.payments.forEach(p => {
        if (isDateInRange(p.date)) ledgerItems.push({ date: p.date, type: 'Payment', charge: 0, payment: p.amount, desc: p.note });
      });
      r.manualFees.forEach(f => {
        if (isDateInRange(f.date)) ledgerItems.push({ date: f.date, type: 'Fee', charge: f.amount, payment: 0, desc: f.description });
      });
      r.adjustments.forEach(a => {
        if (isDateInRange(a.date)) {
          if (a.amount > 0) ledgerItems.push({ date: a.date, type: 'Adjustment (Credit)', charge: 0, payment: a.amount, desc: a.reason });
          else ledgerItems.push({ date: a.date, type: 'Adjustment (Charge)', charge: Math.abs(a.amount), payment: 0, desc: a.reason });
        }
      });
    });

    ledgerItems.sort((a, b) => a.date.localeCompare(b.date));

    let runningBalance = 0;
    const ledgerWithBalance = ledgerItems.map(item => {
      runningBalance += item.charge - item.payment;
      return { ...item, balance: runningBalance };
    });

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tenant Ledger</h3>
        <p className="text-sm text-gray-500 mb-4">Chronological account statement with running balance.</p>
        
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Charge</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ledgerWithBalance.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-3 text-center text-gray-500">No ledger activity in this period.</td></tr>
              ) : (
                ledgerWithBalance.map((t, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-900">{t.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">{t.type}</div>
                      <div className="text-gray-500 text-xs">{t.desc}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-right text-red-600">{t.charge > 0 ? formatCurrency(t.charge) : ''}</td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-right text-green-600">{t.payment > 0 ? formatCurrency(t.payment) : ''}</td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-right font-medium text-gray-900">{formatCurrency(t.balance)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPaymentHistory = () => {
    const payments: any[] = [];
    data.records.forEach(r => {
      r.payments.forEach(p => {
        if (isDateInRange(p.date)) payments.push({ ...p, monthId: r.id });
      });
    });
    payments.sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Payment History</h3>
        <p className="text-sm text-gray-500 mb-4">All payments received in the selected period.</p>
        
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied To</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-3 text-center text-gray-500">No payments found.</td></tr>
              ) : (
                payments.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-900">{p.date}</td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-500">{p.monthId}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.note || '-'}</td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-right font-medium text-green-600">{formatCurrency(p.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOutstandingBalances = () => {
    const outstanding = stats.filter(r => r.stats.remainingBalance > 0);
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Outstanding Balances</h3>
        <p className="text-sm text-gray-500 mb-4">Months with an unpaid balance.</p>
        
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month Record</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Late</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Due</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {outstanding.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-3 text-center text-gray-500">No outstanding balances!</td></tr>
              ) : (
                outstanding.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm font-medium text-gray-900">{r.id}</td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-500">{r.dueDate}</td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-red-600">{r.stats.daysLate > 0 ? r.stats.daysLate : 0}</td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-right font-bold text-red-600">{formatCurrency(r.stats.remainingBalance)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLateFees = () => {
    const lateFeeRecords = stats.filter(r => r.stats.totalLateFees > 0);
    const totalLateFees = lateFeeRecords.reduce((sum, r) => sum + r.stats.totalLateFees, 0);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Late Fees Report</h3>
        <p className="text-sm text-gray-500 mb-4">Summary of assessed late fees.</p>
        
        <div className="bg-white border rounded-lg p-6 mb-6 inline-block">
          <div className="text-sm text-gray-500">Total Late Fees Assessed</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalLateFees)}</div>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month Record</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Late</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Late Fee Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lateFeeRecords.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-3 text-center text-gray-500">No late fees assessed.</td></tr>
              ) : (
                lateFeeRecords.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm font-medium text-gray-900">{r.id}</td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-500">{r.stats.daysLate}</td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-right font-medium text-red-600">{formatCurrency(r.stats.totalLateFees)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderNotices = () => {
    const notices: any[] = [];
    data.records.forEach(r => {
      (r.notices || []).forEach(n => {
        if (isDateInRange(n.date)) notices.push({ ...n, monthId: r.id });
      });
    });
    notices.sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Eviction & Notice History</h3>
        <p className="text-sm text-gray-500 mb-4">Log of all legal notices served.</p>
        
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notices.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-3 text-center text-gray-500">No notices recorded in this period.</td></tr>
              ) : (
                notices.map((n, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm text-gray-900">{n.date}</td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm font-medium text-gray-900">{n.type}</td>
                    <td className="px-4 py-3 whitespace-normal break-words text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        n.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        n.status === 'Served' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{n.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSecurityDeposit = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Security Deposit Ledger</h3>
        <p className="text-sm text-gray-500 mb-4">Tracking of security deposits held.</p>
        
        <div className="bg-white border rounded-lg p-6 max-w-2xl">
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-700">Security Deposit Amount (Required)</span>
            <span className="text-gray-900 font-medium">{formatCurrency(data.settings.securityDepositAmount || 0)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-700">Security Deposit Held (Actual)</span>
            <span className="text-gray-900 font-medium">{formatCurrency(data.settings.securityDepositHeld || 0)}</span>
          </div>
          <div className="flex justify-between py-4 mt-2 bg-gray-50 px-4 rounded-lg">
            <span className="font-bold text-gray-900">Difference</span>
            <span className={`font-bold ${((data.settings.securityDepositHeld || 0) - (data.settings.securityDepositAmount || 0)) < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency((data.settings.securityDepositHeld || 0) - (data.settings.securityDepositAmount || 0))}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderTrustAccounting = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Trust Accounting Report</h3>
        <p className="text-sm text-gray-500 mb-4">Summary of funds held in trust (Security Deposits).</p>
        {renderSecurityDeposit()}
        <p className="text-xs text-gray-400 mt-4">* Note: For a single-tenant application, Trust Accounting is equivalent to the Security Deposit Ledger.</p>
      </div>
    );
  };

  const renderActiveReport = () => {
    switch (activeReport) {
      case 'rent-roll': return renderRentRoll();
      case 'income-statement': return renderIncomeStatement();
      case 'cash-flow': return renderCashFlow();
      case 'balance-sheet': return renderBalanceSheet();
      case 'general-ledger': return renderGeneralLedger();
      case 'aging': return renderAgingReport();
      case 'tenant-ledger': return renderTenantLedger();
      case 'payment-history': return renderPaymentHistory();
      case 'outstanding-balances': return renderOutstandingBalances();
      case 'late-fees': return renderLateFees();
      case 'notices': return renderNotices();
      case 'security-deposit': return renderSecurityDeposit();
      case 'trust-accounting': return renderTrustAccounting();
      default: return <div>Select a report</div>;
    }
  };

  return (
    <div className="space-y-6">
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => {
           setShowEmailModal(false);
           setPdfBase64(null);
        }}
        onSend={handleSendEmailReport}
        defaultTo={[data.settings.tenantEmail, data.settings.tenantEmail2].filter(Boolean).join(', ')}
        landlordEmail={data.settings.landlordEmail}
        savedContacts={data.settings.savedContacts || []}
        onSaveContacts={(contacts) => updateSettings({ ...data.settings, savedContacts: contacts })}
        onDeleteContact={(contact) => {
          const current = data.settings.savedContacts || [];
          updateSettings({ ...data.settings, savedContacts: current.filter(c => c !== contact) });
        }}
        pdfBase64={pdfBase64}
        defaultMessage={emailDefaultMessage}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Generate financial, collection, and compliance reports.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border shadow-sm">
          <Calendar size={18} className="text-gray-400" />
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="text-sm border-none focus:ring-0 text-gray-700 bg-transparent"
          />
          <span className="text-gray-400">to</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="text-sm border-none focus:ring-0 text-gray-700 bg-transparent"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
              <FileText size={14} className="mr-2" /> Financial Reports
            </h3>
            <div className="space-y-1">
              {[
                { id: 'rent-roll', label: 'Rent Roll' },
                { id: 'income-statement', label: 'Income Statement (P&L)' },
                { id: 'cash-flow', label: 'Cash Flow Report' },
                { id: 'balance-sheet', label: 'Balance Sheet' },
                { id: 'general-ledger', label: 'General Ledger' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveReport(item.id as ReportType); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeReport === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
              <DollarSign size={14} className="mr-2" /> A/R & Collections
            </h3>
            <div className="space-y-1">
              {[
                { id: 'aging', label: 'Aging Report' },
                { id: 'tenant-ledger', label: 'Tenant Ledger' },
                { id: 'payment-history', label: 'Payment History' },
                { id: 'outstanding-balances', label: 'Outstanding Balances' },
                { id: 'late-fees', label: 'Late Fees Report' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveReport(item.id as ReportType); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeReport === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
              <Scale size={14} className="mr-2" /> Legal & Compliance
            </h3>
            <div className="space-y-1">
              {[
                { id: 'notices', label: 'Eviction & Notice History' },
                { id: 'security-deposit', label: 'Security Deposit Ledger' },
                { id: 'trust-accounting', label: 'Trust Accounting Report' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveReport(item.id as ReportType); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeReport === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 bg-gray-50/50 rounded-xl border border-gray-100 p-6 min-h-[500px]">
          <div className="flex justify-end mb-4 space-x-2">
            {activeReport === 'general-ledger' && (
              <button 
                onClick={handleDownloadCSV}
                className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-md shadow-sm hover:bg-green-100 transition"
              >
                <Download size={16} />
                <span>Export CSV</span>
              </button>
            )}
            <button 
              onClick={handleEmailClick}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 bg-white border px-3 py-1.5 rounded-md shadow-sm"
            >
              <Mail size={16} />
              <span>Email</span>
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 bg-white border px-3 py-1.5 rounded-md shadow-sm"
            >
              <Download size={16} />
              <span>Print / PDF</span>
            </button>
          </div>
          <div id="report-content" className="bg-white p-6 rounded-lg">
            {renderActiveReport()}
          </div>
        </div>
      </div>
    </div>
  );
};
