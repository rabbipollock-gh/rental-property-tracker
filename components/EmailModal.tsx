import React, { useState, useEffect } from 'react';
import { Mail, X, Users, Trash2, FileText } from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (toEmails: string, ccMyself: boolean, customMessage: string) => void;
  defaultTo: string;
  landlordEmail?: string;
  savedContacts?: string[];
  onSaveContacts?: (contacts: string[]) => void;
  onDeleteContact?: (contact: string) => void;
  pdfBase64?: string | null;
  defaultMessage?: string;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  onSend,
  defaultTo,
  landlordEmail,
  savedContacts = [],
  onSaveContacts,
  onDeleteContact,
  pdfBase64,
  defaultMessage = ''
}) => {
  const [emails, setEmails] = useState(defaultTo);
  const [ccMyself, setCcMyself] = useState(false);
  const [customMessage, setCustomMessage] = useState(defaultMessage);

  useEffect(() => {
    if (isOpen) {
      setEmails(defaultTo);
      setCcMyself(false);
      setCustomMessage(defaultMessage);
    }
  }, [isOpen, defaultTo, defaultMessage]);

  const handleSend = () => {
    const inputEmails = emails.split(',').map(e => e.trim()).filter(Boolean);
    
    // Auto-save new contacts
    if (onSaveContacts) {
      const newContacts = inputEmails.filter(e => !savedContacts.includes(e));
      if (newContacts.length > 0) {
        onSaveContacts([...savedContacts, ...newContacts]);
      }
    }
    
    onSend(inputEmails.join(', '), ccMyself, customMessage.trim());
  };

  const handleChipClick = (contact: string) => {
    const currentEmails = emails.split(',').map(e => e.trim()).filter(Boolean);
    if (!currentEmails.includes(contact)) {
      currentEmails.push(contact);
      setEmails(currentEmails.join(', '));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900 bg-opacity-50 overflow-y-auto w-full no-print">
      <div className={`bg-white rounded-xl shadow-xl w-full p-6 flex flex-col md:flex-row gap-6 transition-all duration-300 ${pdfBase64 ? 'max-w-5xl' : 'max-w-md'}`}>
        
        {/* Left Column: Email Form */}
        <div className={`flex flex-col ${pdfBase64 ? 'w-full md:w-1/3 shrink-0' : 'w-full'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Mail className="w-5 h-5 mr-3 text-blue-600" />
              Send Email
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 md:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-5 flex-grow">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                To: Email Address(es)
              </label>
              <input
                type="text"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm border p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="tenant@example.com, another@example.com"
              />
              <p className="text-xs text-gray-500 mt-1.5">Separate multiple emails with commas.</p>
            </div>

            {savedContacts.length > 0 && (
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 max-h-48 overflow-y-auto">
                <label className="flex items-center text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
                  <Users size={14} className="mr-1.5" />
                  Saved Contacts
                </label>
                <div className="flex flex-col gap-2">
                  {savedContacts.map(contact => (
                    <div key={contact} className="flex items-center justify-between group bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm hover:border-blue-300 transition-colors">
                      <button
                        onClick={() => handleChipClick(contact)}
                        className="text-sm px-2 text-left text-gray-700 hover:text-blue-700 flex-grow truncate"
                        title={contact}
                      >
                        {contact}
                      </button>
                      {onDeleteContact && (
                        <button
                          onClick={() => onDeleteContact(contact)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete contact"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {landlordEmail && (
              <div className="flex items-center pt-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <input
                  id="cc-myself"
                  type="checkbox"
                  checked={ccMyself}
                  onChange={(e) => setCcMyself(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="cc-myself" className="ml-2.5 block text-sm font-medium text-gray-900 cursor-pointer">
                  CC Myself ({landlordEmail})
                </label>
              </div>
            )}

            <div className="pt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Message
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm border p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y min-h-[160px] text-sm"
                placeholder="Type your message here..."
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center tracking-wide transition-colors shadow-sm"
              disabled={!emails.trim()}
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </button>
          </div>
        </div>

        {/* Right Column: PDF Preview */}
        {pdfBase64 && (
          <div className="hidden md:flex flex-col w-full md:w-2/3 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 min-h-[500px] shadow-inner relative">
            <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
               <div className="flex items-center text-sm font-medium">
                  <FileText className="w-4 h-4 mr-2 text-gray-400" />
                  PDF Attachment Preview
               </div>
               <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
               </button>
            </div>
            <iframe 
               src={`data:application/pdf;base64,${pdfBase64}`} 
               className="w-full flex-grow border-0" 
               title="PDF Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
};
