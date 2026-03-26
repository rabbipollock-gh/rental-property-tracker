import { DocumentItem } from '../../types';

export const useVault = (documents: DocumentItem[] = [], setDocuments: (docs: DocumentItem[]) => void) => {
  const addDocument = (doc: DocumentItem) => {
    setDocuments([...documents, doc]);
  };

  const updateDocument = (doc: Partial<DocumentItem> & { id: string }) => {
    setDocuments(documents.map(d => (d.id === doc.id ? { ...d, ...doc } : d)));
  };

  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  return {
    documents,
    addDocument,
    updateDocument,
    deleteDocument
  };
};
