import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { UploadCloud, FileText, Trash2, Plus, ExternalLink, Filter } from 'lucide-react';
import { DocumentItem } from '../types';
import { Modal } from '../components/Modal';

export const Documents: React.FC = () => {
  const { documents = [], addDocument, deleteDocument, properties = [], tenants = [] } = useStore();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [filterProperty, setFilterProperty] = useState<string>('all');
  
  const [editForm, setEditForm] = useState<Partial<DocumentItem>>({
      type: 'Lease'
  });

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editForm.name || !editForm.url) return;
      
      const newDoc: DocumentItem = {
          id: crypto.randomUUID(),
          name: editForm.name,
          type: editForm.type as any || 'Other',
          url: editForm.url,
          dateAdded: new Date().toISOString().split('T')[0],
          propertyId: editForm.propertyId,
          tenantId: editForm.tenantId
      };
      
      addDocument(newDoc);
      setAddModalOpen(false);
      setEditForm({ type: 'Lease' });
  };

  const filteredDocs = filterProperty === 'all' 
    ? documents 
    : documents.filter(d => d.propertyId === filterProperty);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Vault</h1>
          <p className="text-gray-500">Secure link storage for leases, receipts, and tax documents.</p>
        </div>
        <div className="flex items-center gap-4">
          {properties.length > 0 && (
            <select 
                value={filterProperty} 
                onChange={e => setFilterProperty(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            >
                <option value="all">Entire Portfolio</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <button onClick={() => setAddModalOpen(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
            <Plus size={18} /><span>Add Document</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         {filteredDocs.length === 0 ? (
             <div className="p-16 text-center">
                <div className="bg-blue-50 p-6 rounded-full inline-flex mb-4">
                    <UploadCloud size={32} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No documents found</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Upload lease agreements, receipts, and tax records by linking their external cloud URLs here.</p>
             </div>
         ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDocs.map(doc => (
                            <tr key={doc.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-blue-50 p-2 rounded text-blue-600">
                                            <FileText size={16} />
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 mt-0.5 border border-gray-200">
                                                {doc.type}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {properties.find(p => p.id === doc.propertyId)?.name || '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {tenants.find(t => t.id === doc.tenantId)?.name || '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {doc.dateAdded}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer">
                                        <span>Open Link</span>
                                        <ExternalLink size={12} />
                                    </a>
                                    <button onClick={() => { if(confirm('Delete document link?')) deleteDocument(doc.id); }} className="text-gray-400 hover:text-red-600 transition p-1.5">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add Document Link">
          <form className="space-y-4" onSubmit={handleSave}>
              <div>
                  <label className="block text-sm font-medium text-gray-700">Document Name</label>
                  <input autoFocus required type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" placeholder="e.g. 2026 Lease Agreement" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">Document Type</label>
                  <select value={editForm.type || 'Lease'} onChange={e => setEditForm({...editForm, type: e.target.value as any})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white">
                      <option value="Lease">Lease Agreement</option>
                      <option value="Receipt">Expense Receipt</option>
                      <option value="Tax">Tax Document</option>
                      <option value="Other">Other</option>
                  </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Property <span className="text-gray-400 font-normal">(Optional)</span></label>
                      <select value={editForm.propertyId || ''} onChange={e => setEditForm({...editForm, propertyId: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white">
                          <option value="">None</option>
                          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Tenant <span className="text-gray-400 font-normal">(Optional)</span></label>
                      <select value={editForm.tenantId || ''} onChange={e => setEditForm({...editForm, tenantId: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white">
                          <option value="">None</option>
                          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">Cloud URL (Google Drive, Dropbox, etc.)</label>
                  <input required type="url" value={editForm.url || ''} onChange={e => setEditForm({...editForm, url: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" placeholder="https://" />
                  <p className="mt-1 text-xs text-gray-500">Provide a secure link to where the file is hosted.</p>
              </div>
              <div className="pt-2">
                  <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md font-medium hover:bg-blue-700 transition">Save Document Link</button>
              </div>
          </form>
      </Modal>

    </div>
  );
};
