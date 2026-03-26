import React from 'react';
import { UploadCloud, FolderLock, FileText, Lock } from 'lucide-react';

export const Documents: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Vault</h1>
          <p className="text-gray-500">Secure cloud storage for leases, receipts, and tax documents.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center mt-8 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <FolderLock size={200} />
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto space-y-6">
            <div className="bg-blue-50 p-6 rounded-full inline-block">
                <UploadCloud size={48} className="text-blue-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900">Coming Soon: Multi-Property Phase</h2>
            
            <p className="text-gray-600 leading-relaxed">
              The Document Vault is currently under construction. In the upcoming release, you will be able to securely upload and organize sensitive files attached to specific properties and tenants.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-6 text-left">
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                     <FileText className="text-gray-400 mb-2" size={24} />
                     <span className="text-sm font-medium text-gray-700">Executed Leases</span>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                     <Lock className="text-gray-400 mb-2" size={24} />
                     <span className="text-sm font-medium text-gray-700">Tax EIN & Docs</span>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                     <FolderLock className="text-gray-400 mb-2" size={24} />
                     <span className="text-sm font-medium text-gray-700">Expense Receipts</span>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};
