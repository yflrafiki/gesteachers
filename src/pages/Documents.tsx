import { useState, useEffect, useRef } from 'react';
import { uploadDocument, getMyDocuments } from '../api/documents';
import { getMyCredentials } from '../api/credentials';
import Layout from '../components/layout/Layout';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import { type Document, type Credential } from '../types/index';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Shield, Eye, X,
  CheckCircle, AlertTriangle, Hash
} from 'lucide-react';

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [credentials, setCredentials] = useState<Record<string, Credential>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await getMyDocuments();
      setDocuments(res.data.documents);
      return res.data.documents as Document[];
    } catch (err) {
      toast.error('Failed to load documents');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchCredentials = async () => {
    try {
      const res = await getMyCredentials();
      const map: Record<string, Credential> = {};
      res.data.credentials.forEach((c: Credential) => { map[c.document_id] = c; });
      setCredentials(map);
      return map;
    } catch (err) {
      return {};
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchCredentials();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // After an upload, verification (blockchain anchor + OCR) runs automatically
  // on the server — poll briefly so the result shows up without a manual action.
  const pollUntilProcessed = (documentId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      const docs = await fetchDocuments();
      await fetchCredentials();
      const doc = docs.find((d) => d.id === documentId);
      if ((doc && doc.ocr_status !== 'pending') || attempts >= 10) {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 1500);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('document', file);
    setUploading(true);
    try {
      const res = await uploadDocument(formData);
      toast.success('Document uploaded! Verifying automatically...');
      await fetchDocuments();
      pollUntilProcessed(res.data.document.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const parseValidation = (doc: any) => {
    if (!doc.ocr_validation) return null;
    try { return JSON.parse(doc.ocr_validation); } catch { return null; }
  };

  if (loading) return <Layout><Spinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">My Documents</h2>
            <p className="text-gray-500 text-sm">
              Upload and manage your certificates and documents
            </p>
          </div>
          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer w-fit transition ${
            uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}>
            <Upload size={16} />
            {uploading ? 'Uploading...' : 'Upload Document'}
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
        </div>

        {/* How it works */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-medium mb-2">How it works:</p>
          <div className="space-y-1 text-amber-700">
            <p>1. Upload your certificate or document (JPG, PNG, PDF — max 10MB)</p>
            <p>2. Its SHA-256 hash is automatically anchored on the blockchain — a permanent, tamper-proof record</p>
            <p>3. OCR then extracts your name and staff ID and checks them against your profile</p>
            <p>4. That's it — no extra steps. You'll see the result below as soon as it's done</p>
          </div>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No documents uploaded yet</p>
            <p className="text-gray-400 text-sm mt-1">Click below to upload your first document</p>
            <label className="mt-4 inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border-2 border-dashed border-amber-300 text-amber-700 px-6 py-4 rounded-xl text-sm cursor-pointer transition">
              <Upload size={20} />
              Click here to upload a document
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const validation = parseValidation(doc);
              const isValidated = validation?.nameMatch || validation?.staffIdMatch;
              const credential = credentials[doc.id];

              return (
                <div key={doc.id} className="bg-white rounded-xl shadow-sm p-5 space-y-3">

                  {/* File Info */}
                  <div className="flex items-start gap-3">
                    <FileText size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{doc.file_name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* OCR Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">OCR Status:</span>
                    <Badge status={doc.ocr_status} />
                  </div>

                  {/* Document Hash */}
                  {(doc as any).document_hash && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Hash size={12} className="text-gray-400" />
                        <p className="text-xs text-gray-400">SHA-256 Document Hash</p>
                      </div>
                      <p className="text-xs font-mono text-gray-600 truncate">
                        {(doc as any).document_hash}
                      </p>
                    </div>
                  )}

                  {/* Blockchain Verification Result — automatic, no action needed */}
                  {credential ? (
                    <div className={`rounded-lg p-3 text-xs flex items-start gap-2 ${
                      credential.verification_status === 'verified'
                        ? 'bg-green-50 border border-green-100'
                        : 'bg-red-50 border border-red-100'
                    }`}>
                      <Shield size={14} className={`shrink-0 mt-0.5 ${
                        credential.verification_status === 'verified' ? 'text-green-600' : 'text-red-600'
                      }`} />
                      <div>
                        <p className={`font-medium ${
                          credential.verification_status === 'verified' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {credential.verification_status === 'verified'
                            ? 'Verified — anchored on the blockchain and matches your profile'
                            : 'Not verified — blockchain anchor or profile match failed'}
                        </p>
                        {credential.blockchain_tx_id && (
                          <p className="text-gray-500 font-mono mt-0.5">{credential.blockchain_tx_id}</p>
                        )}
                      </div>
                    </div>
                  ) : doc.ocr_status === 'completed' && (
                    <div className="rounded-lg p-3 text-xs flex items-center gap-2 bg-gray-50 border border-gray-100 text-gray-500">
                      <Shield size={14} className="shrink-0" />
                      Verification still in progress — refresh in a moment
                    </div>
                  )}

                  {/* OCR Validation Result */}
                  {doc.ocr_status === 'completed' && validation && (
                    <div className={`rounded-lg p-3 text-xs space-y-1 ${
                      isValidated
                        ? 'bg-green-50 border border-green-100'
                        : 'bg-yellow-50 border border-yellow-100'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {isValidated
                          ? <CheckCircle size={14} className="text-green-600 shrink-0" />
                          : <AlertTriangle size={14} className="text-yellow-600 shrink-0" />
                        }
                        <p className={`font-medium ${
                          isValidated ? 'text-green-700' : 'text-yellow-700'
                        }`}>
                          {isValidated
                            ? 'Document validated against your profile'
                            : 'Could not fully validate against your profile'
                          }
                        </p>
                      </div>
                      {validation.details?.map((d: string, i: number) => (
                        <p key={i} className="text-gray-600 pl-5">{d}</p>
                      ))}
                      {validation.parsedFields?.institution && (
                        <p className="text-gray-500 pl-5">
                          Institution: {validation.parsedFields.institution}
                        </p>
                      )}
                      {validation.parsedFields?.qualification && (
                        <p className="text-gray-500 pl-5">
                          Qualification: {validation.parsedFields.qualification}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {doc.ocr_status === 'completed' && (
                      <button
                        onClick={() => setSelected(doc)}
                        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition"
                      >
                        <Eye size={14} />
                        View OCR Text
                      </button>
                    )}
                    {doc.ocr_status === 'pending' && (
                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                        <span className="animate-pulse">●</span>
                        Anchoring on blockchain and running OCR...
                      </span>
                    )}
                    {doc.ocr_status === 'failed' && (
                      <span className="text-xs text-red-500">
                        OCR failed — try uploading a clearer image
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* OCR Text Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">OCR Extracted Text</h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{selected.file_name}</p>
                </div>
                <button onClick={() => setSelected(null)}>
                  <X size={20} className="text-gray-500 hover:text-gray-700" />
                </button>
              </div>

              {/* Validation summary in modal */}
              {(() => {
                const val = parseValidation(selected);
                if (!val) return null;
                const isValid = val.nameMatch || val.staffIdMatch;
                return (
                  <div className={`rounded-lg p-3 mb-4 text-xs ${
                    isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <p className={`font-semibold mb-1 ${isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                      Profile Validation Results
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {val.nameMatch
                          ? <CheckCircle size={12} className="text-green-500" />
                          : <X size={12} className="text-red-400" />
                        }
                        <span className="text-gray-600">Name Match</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {val.staffIdMatch
                          ? <CheckCircle size={12} className="text-green-500" />
                          : <X size={12} className="text-red-400" />
                        }
                        <span className="text-gray-600">Staff ID Match</span>
                      </div>
                    </div>
                    {val.details?.map((d: string, i: number) => (
                      <p key={i} className="text-gray-600">{d}</p>
                    ))}
                  </div>
                );
              })()}

              {/* Document hash */}
              {selected.document_hash && (
                <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4">
                  <p className="text-xs text-gray-400 mb-0.5">SHA-256 Hash (anchored on blockchain)</p>
                  <p className="text-xs font-mono text-gray-700 break-all">{selected.document_hash}</p>
                </div>
              )}

              {/* Raw OCR text */}
              <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Raw OCR Extracted Text:</p>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {selected.ocr_extracted_text || 'No text extracted from this document'}
                </pre>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Documents;
