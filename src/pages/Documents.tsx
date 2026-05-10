import { useState, useEffect, useRef } from 'react';
import { uploadDocument, getMyDocuments } from '../api/documents';
import { submitForVerification } from '../api/credentials';
import Layout from '../components/layout/Layout';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import { type Document } from '../types/index';
import toast from 'react-hot-toast';
import { Upload, FileText, Shield, Eye, X } from 'lucide-react';

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Document | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await getMyDocuments();
      setDocuments(res.data.documents);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);

    setUploading(true);
    try {
      await uploadDocument(formData);
      toast.success('Document uploaded! OCR processing started.');
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleVerify = async (documentId: string) => {
    setVerifying(documentId);
    try {
      await submitForVerification(documentId);
      toast.success('Submitted for blockchain verification!');
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(null);
    }
  };

  if (loading) return <Layout><Spinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">My Documents</h2>
            <p className="text-gray-500 text-sm">Upload and manage your certificates and documents</p>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50 w-fit"
            >
              <Upload size={16} />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </div>

        {/* Upload Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">How it works:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            <li>Upload your certificate or document (JPG, PNG or PDF, max 5MB)</li>
            <li>Our OCR system automatically extracts the text</li>
            <li>Submit for blockchain verification to get a tamper-proof credential</li>
          </ol>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No documents uploaded yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "Upload Document" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <FileText size={20} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{doc.file_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">OCR:</span>
                    <Badge status={doc.ocr_status} />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  {doc.ocr_status === 'completed' && (
                    <button
                      onClick={() => setSelected(doc)}
                      className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition"
                    >
                      <Eye size={14} />
                      View OCR
                    </button>
                  )}
                  {doc.ocr_status === 'completed' && (
                    <button
                      onClick={() => handleVerify(doc.id)}
                      disabled={verifying === doc.id}
                      className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      <Shield size={14} />
                      {verifying === doc.id ? 'Verifying...' : 'Verify on Blockchain'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* OCR Text Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">OCR Extracted Text</h3>
                <button onClick={() => setSelected(null)}>
                  <X size={20} className="text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">{selected.file_name}</p>
              <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {selected.ocr_extracted_text || 'No text extracted'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Documents;