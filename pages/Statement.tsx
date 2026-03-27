import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { calculateMonthStats, formatCurrency, formatDate } from '../utils/calculations';
import { MONTH_NAMES } from '../constants';
import { ArrowLeft, Printer, Mail } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { generatePDFBase64, sendEmailWithPDF } from '../utils/sharePDF';
import { EmailModal } from '../components/EmailModal';

export const Statement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getMonth, data, updateSettings } = useStore();
  const settings = data.settings;
  
  const record = getMonth(id || '');
  const stats = useMemo(() => record ? calculateMonthStats(record) : null, [record]);

  if (!record || !stats) return <div className="p-8">Record not found</div>;

  const handlePrint = () => {
    const element = document.getElementById('statement-content');
    if (!element) return;
    
    const opt = {
      margin:       0.5,
      filename:     `statement-${MONTH_NAMES[record.month - 1]}-${record.year}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const [showEmailModal, setShowEmailModal] = React.useState(false);
  const [pdfBase64, setPdfBase64] = React.useState<string | null>(null);

  const handleEmailClick = async () => {
    const base64 = await generatePDFBase64(
      'statement-content',
      `statement-${MONTH_NAMES[record.month - 1]}-${record.year}.pdf`,
      'portrait'
    );
    setPdfBase64(base64);
    setShowEmailModal(true);
  };

  const emailDefaultMessage = `Hi ${[settings.tenantName, settings.tenantName2].filter(Boolean).join(' and ')},\n\nPlease find your rent statement for ${MONTH_NAMES[record.month - 1]} ${record.year} attached.\n\nThank you,\n${settings.landlordName}`;

  const handleSendEmail = async (toEmails: string, ccMyself: boolean, finalMessage: string) => {
    
    // Add landlord email if CC selected
    let finalRecipients = toEmails;
    if (ccMyself && settings.landlordEmail && !toEmails.includes(settings.landlordEmail)) {
        finalRecipients += `, ${settings.landlordEmail}`;
    }

    if (pdfBase64) {
      await sendEmailWithPDF(
          `statement-${MONTH_NAMES[record.month - 1]}-${record.year}.pdf`,
          `Rent Statement: ${MONTH_NAMES[record.month - 1]} ${record.year}`,
          finalMessage,
          pdfBase64,
          finalRecipients,
          settings.landlordEmail,
          settings.gmailAppPassword || ''
      );
    }
    setShowEmailModal(false);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8">
       {/* Actions Bar - Hidden on Print */}
       <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center no-print">
          <Link to={`/month/${record.id}`} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
             <ArrowLeft size={20} />
             <span>Back to Details</span>
          </Link>
          <div className="flex space-x-2">
            <button 
              onClick={handleEmailClick}
              className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 transition-colors"
            >
               <Mail size={18} />
               <span>Email Statement</span>
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors"
            >
               <Printer size={18} />
               <span>Print / Save as PDF</span>
            </button>
          </div>
       </div>

       <EmailModal
         isOpen={showEmailModal}
         onClose={() => {
            setShowEmailModal(false);
            setPdfBase64(null);
         }}
         onSend={handleSendEmail}
         defaultTo={[settings.tenantEmail, settings.tenantEmail2].filter(Boolean).join(', ')}
         landlordEmail={settings.landlordEmail}
         savedContacts={settings.savedContacts || []}
         onSaveContacts={(contacts) => updateSettings({ ...settings, savedContacts: contacts })}
         onDeleteContact={(contact) => {
           const current = settings.savedContacts || [];
           updateSettings({ ...settings, savedContacts: current.filter(c => c !== contact) });
         }}
         pdfBase64={pdfBase64}
         defaultMessage={emailDefaultMessage}
       />

       {/* Statement Sheet - A4 styling approximation */}
       <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 shadow-lg print:shadow-none print:w-full print:max-w-none print:p-0" id="statement-content">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
              <div>
                  <h1 className="text-3xl font-bold text-gray-900">RENT STATEMENT</h1>
                  <p className="text-gray-500 mt-1">
                      Period: {MONTH_NAMES[record.month - 1]} {record.year}
                  </p>
                  <p className="text-sm text-gray-400 mt-4">Statement Date: {new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                  <h2 className="font-bold text-lg">{settings.landlordName}</h2>
                  <div className="text-sm text-gray-600 whitespace-pre-line">{settings.landlordAddress}</div>
                  <div className="text-sm text-blue-600 mt-1">{settings.landlordEmail}</div>
                  {settings.landlordPhone && <div className="text-sm text-gray-600">{settings.landlordPhone}</div>}
              </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-8 mb-8">
             <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tenant</h3>
                <div className="font-semibold">{settings.tenantName}</div>
                <div className="text-sm text-gray-600 whitespace-pre-line">{settings.tenantAddress}</div>
                <div className="text-sm text-gray-500 mt-1">{settings.tenantEmail}</div>
             </div>
             <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Property</h3>
                <div className="text-sm text-gray-600">{settings.propertyAddress}</div>
             </div>
          </div>

          {/* Line Items */}
          <table className="w-full mb-8">
              <thead>
                  <tr className="border-b-2 border-gray-800">
                      <th className="text-left py-2 font-bold text-gray-800">Description</th>
                      <th className="text-left py-2 font-bold text-gray-800">Date</th>
                      <th className="text-right py-2 font-bold text-gray-800">Amount</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                  {/* Rent */}
                  <tr>
                      <td className="py-3">Monthly Rent</td>
                      <td className="py-3">{formatDate(record.dueDate)} (Due)</td>
                      <td className="py-3 text-right">{formatCurrency(record.monthlyRent)}</td>
                  </tr>

                  {/* Manual Fees */}
                  {record.manualFees.map((fee, i) => (
                      <tr key={`fee-${i}`}>
                          <td className="py-3">{fee.description}</td>
                          <td className="py-3">{formatDate(fee.date)}</td>
                          <td className="py-3 text-right">{formatCurrency(fee.amount)}</td>
                      </tr>
                  ))}

                  {/* Adjustments */}
                  {record.adjustments.map((adj, i) => (
                      <tr key={`adj-${i}`}>
                          <td className="py-3">Adjustment: {adj.reason}</td>
                          <td className="py-3">{formatDate(adj.date)}</td>
                          <td className="py-3 text-right">{formatCurrency(adj.amount)}</td>
                      </tr>
                  ))}

                  {/* Late Fees */}
                  {record.lateFeeOverride !== undefined ? (
                      <tr>
                          <td className="py-3 text-red-600">Late Fee (Manual Override)</td>
                          <td className="py-3">-</td>
                          <td className="py-3 text-right text-red-600">{formatCurrency(record.lateFeeOverride)}</td>
                      </tr>
                  ) : (
                      <>
                          {stats.flatLateFee > 0 && (
                              <tr>
                                  <td className="py-3 text-red-600">Late Fee (Flat 10%)</td>
                                  <td className="py-3">-</td>
                                  <td className="py-3 text-right text-red-600">{formatCurrency(stats.flatLateFee)}</td>
                              </tr>
                          )}
                          {stats.dailyLateFee > 0 && (
                              <tr>
                                  <td className="py-3 text-red-600">Daily Late Fees ({stats.daysLate} days @ $5)</td>
                                  <td className="py-3">-</td>
                                  <td className="py-3 text-right text-red-600">{formatCurrency(stats.dailyLateFee)}</td>
                              </tr>
                          )}
                      </>
                  )}
              </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex justify-end mb-8">
              <div className="w-1/2 space-y-2">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600">Total Charges</span>
                      <span className="font-semibold">{formatCurrency(stats.totalOwed)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600">Payments Received</span>
                      <span className="font-semibold text-green-600">-{formatCurrency(stats.totalPayments)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-gray-800 text-lg">
                      <span className="font-bold">Amount Due</span>
                      <span className={`font-bold ${stats.remainingBalance > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                          {formatCurrency(stats.remainingBalance)}
                      </span>
                  </div>
              </div>
          </div>

          {/* Payment History List (For reference) */}
          {record.payments.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Payment History</h4>
                  <div className="bg-gray-50 rounded p-4">
                      <table className="w-full text-sm">
                          <tbody>
                              {record.payments.map((p, i) => (
                                  <tr key={`ph-${i}`}>
                                      <td className="py-1 w-1/4">{formatDate(p.date)}</td>
                                      <td className="py-1 w-1/2 text-gray-500 italic">{p.note}</td>
                                      <td className="py-1 w-1/4 text-right">{formatCurrency(p.amount)}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          <div className="mt-12 text-center text-xs text-gray-400">
              Generated by Rental Property Tracker
          </div>

       </div>
    </div>
  );
};