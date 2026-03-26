import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { calculateMonthStats, formatCurrency, formatDate } from '../utils/calculations';
import { ArrowLeft, Printer, Mail } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { generatePDFBase64, sendEmailWithPDF } from '../utils/sharePDF';
import { EmailModal } from '../components/EmailModal';

export const PaymentReceipt: React.FC = () => {
  const { monthId, paymentId } = useParams<{ monthId: string, paymentId: string }>();
  const { data, getMonth, updateSettings } = useStore();
  
  const record = getMonth(monthId || '');
  const payment = record?.payments.find(p => p.id === paymentId);

  const stats = useMemo(() => {
    if (!record) return null;
    return calculateMonthStats(record);
  }, [record]);

  // Overall balance logic (across all months)
  const overallBalance = useMemo(() => {
    return data.records.reduce((sum, r) => sum + calculateMonthStats(r).remainingBalance, 0);
  }, [data.records]);

  if (!record || !payment || !stats) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-700">Payment Record Not Found</h2>
        <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Return to Dashboard</Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('receipt-content');
    if (!element) return;
    
    const opt = {
      margin:       0.5,
      filename:     `receipt_${payment.date}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const [showEmailModal, setShowEmailModal] = React.useState(false);
  const [pdfBase64, setPdfBase64] = React.useState<string | null>(null);

  const handleEmailClick = async () => {
    const base64 = await generatePDFBase64('receipt-content', `receipt_${payment.date}.pdf`, 'portrait');
    setPdfBase64(base64);
    setShowEmailModal(true);
  };

  const handleSendEmail = async (toEmails: string, ccMyself: boolean, customMessage: string) => {
    // Add landlord email if CC selected
    let finalRecipients = toEmails;
    if (ccMyself && data.settings.landlordEmail && !toEmails.includes(data.settings.landlordEmail)) {
        finalRecipients += `, ${data.settings.landlordEmail}`;
    }

    const defaultBody = `Hello,\n\nPlease find attached your payment receipt for ${formatCurrency(payment.amount)} received on ${formatDate(payment.date)}.\n\nThank you,\n${data.settings.landlordName || 'Management'}`;
    const formattedBody = customMessage ? `${customMessage}\n\n---\n${defaultBody}` : defaultBody;

    if (pdfBase64) {
      await sendEmailWithPDF(
          `receipt_${payment.date}.pdf`,
          `Payment Receipt - ${formatDate(payment.date)}`,
          formattedBody,
          pdfBase64,
          finalRecipients,
          data.settings.landlordEmail,
          data.settings.gmailAppPassword || ''
      );
    }
    setShowEmailModal(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Action Bar - Hidden when printing */}
      <div className="flex justify-between items-center no-print bg-white p-4 rounded-lg border shadow-sm">
        <Link to={`/month/${record.id}`} className="flex items-center text-gray-500 hover:text-gray-700 font-medium">
          <ArrowLeft size={20} className="mr-1" /> Back to Month
        </Link>
        <div className="flex space-x-3">
          <button 
            onClick={handleEmailClick}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            <Mail size={18} />
            <span>Email</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            <Printer size={18} />
            <span>Save PDF</span>
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Printer size={18} />
            <span>Print</span>
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
        defaultTo={[data.settings.tenantEmail, data.settings.tenantEmail2].filter(Boolean).join(', ')}
        landlordEmail={data.settings.landlordEmail}
        savedContacts={data.settings.savedContacts || []}
        onSaveContacts={(contacts) => updateSettings({ ...data.settings, savedContacts: contacts })}
        onDeleteContact={(contact) => {
          const current = data.settings.savedContacts || [];
          updateSettings({ ...data.settings, savedContacts: current.filter(c => c !== contact) });
        }}
        pdfBase64={pdfBase64}
      />

      {/* Receipt Document */}
      <div id="receipt-content" className="bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-gray-200">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">RECEIPT</h1>
            <p className="text-gray-500 mt-2 font-medium">Receipt #: {payment.id.toUpperCase()}</p>
            <p className="text-gray-500 font-medium">Date: {formatDate(payment.date)}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">{data.settings.landlordName || 'Property Management'}</h2>
            <p className="text-gray-600 mt-1 whitespace-pre-line">{data.settings.landlordAddress || 'No address provided'}</p>
            <p className="text-gray-600">{data.settings.landlordEmail}</p>
          </div>
        </div>

        {/* Tenant Info */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Received From</h3>
          <p className="text-lg font-bold text-gray-900">{data.settings.tenantName || 'Tenant'}</p>
          <p className="text-gray-600 whitespace-pre-line">{data.settings.tenantAddress || data.settings.propertyAddress}</p>
        </div>

        {/* Payment Summary Box */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-10 flex flex-col sm:flex-row justify-between items-center outline outline-1 outline-offset-4 outline-green-50">
           <div className="mb-4 sm:mb-0 text-center sm:text-left">
              <p className="text-green-800 font-medium">Payment Amount Received</p>
              <p className="text-4xl font-black text-green-700 mt-1">{formatCurrency(payment.amount)}</p>
           </div>
           <div className="text-center sm:text-right">
              <p className="text-sm text-green-800 bg-green-200/50 px-3 py-1 rounded-full inline-block font-medium">
                Applied to: {record.id}
              </p>
           </div>
        </div>

        {/* Details Table */}
        <div className="mb-10">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Payment Details</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Transaction Date</span>
              <span className="text-gray-900">{formatDate(payment.date)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Payment Note / Method</span>
              <span className="text-gray-900">{payment.note || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Account Balances Status */}
        <div className="border-t-2 border-gray-100 pt-8 mt-12 bg-gray-50 -mx-8 sm:-mx-12 px-8 sm:px-12 pb-8 sm:pb-12 -mb-8 sm:-mb-12 rounded-b-xl">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Account Status Post-Payment</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="bg-white p-5 rounded-lg border shadow-sm">
                <p className="text-sm text-gray-500 font-medium">{record.id} Remaining Balance</p>
                <p className={`text-2xl font-bold mt-1 ${stats.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                   {formatCurrency(stats.remainingBalance)}
                </p>
                {stats.remainingBalance <= 0 && <p className="text-xs text-green-600 mt-1 font-medium">✓ Month fully paid</p>}
             </div>
             <div className="bg-white p-5 rounded-lg border shadow-sm">
                <p className="text-sm text-gray-500 font-medium">Total Overall Balance Owed</p>
                <p className={`text-2xl font-bold mt-1 ${overallBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                   {formatCurrency(overallBalance)}
                </p>
                {overallBalance <= 0 && <p className="text-xs text-green-600 mt-1 font-medium">✓ Account up to date</p>}
             </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-400">
             Thank you for your business.
          </div>
        </div>

      </div>
    </div>
  );
};
