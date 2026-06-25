import { useState, useEffect, useRef } from 'react';
import { checkEligibility, getPromotionFormData, applyPromotion, getMyPromotions, submitPromotionDocument } from '../api/promotions';
import { uploadDocument, getDocumentById } from '../api/documents';
import Layout from '../components/layout/Layout';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import { type Application } from '../types/index';
import toast from 'react-hot-toast';
import { TrendingUp, CheckCircle, XCircle, X, Upload } from 'lucide-react';

const DOCUMENT_TYPES = [
  { value: 'qualification', label: 'Qualification (degree / diploma)' },
  { value: 'license', label: 'Teaching License / NTC Certificate' },
  { value: 'other', label: 'Other supporting document' },
];

const Promotions = () => {
  const [promotions, setPromotions] = useState<Application[]>([]);
  const [eligibility, setEligibility] = useState<any>(null);
  const [eligibilityLoaded, setEligibilityLoaded] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDocForm, setShowDocForm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [documentType, setDocumentType] = useState('qualification');
  const [docResultMsg, setDocResultMsg] = useState<{ kind: 'retry' | 'review'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const latestApplication = promotions[0] ?? null;
  const applicationStatus = latestApplication?.status;
  const hasActiveApplication = ['pending', 'more_info', 'approved'].includes(applicationStatus);

  const fetchData = async () => {
    try {
      const [eligibilityResult, promotionsResult] = await Promise.allSettled([
        checkEligibility(),
        getMyPromotions(),
      ]);

      if (eligibilityResult.status === 'fulfilled') {
        setEligibility(eligibilityResult.value.data);
      } else {
        console.error('Eligibility load failed:', eligibilityResult.reason);
        toast.error(eligibilityResult.reason?.response?.data?.message || 'Failed to load eligibility data');
      }
      setEligibilityLoaded(true);

      if (promotionsResult.status === 'fulfilled') {
        setPromotions(promotionsResult.value.data.applications);
      } else {
        console.error('Promotions load failed:', promotionsResult.reason);
        toast.error(promotionsResult.reason?.response?.data?.message || 'Failed to load promotion history');
      }

      try {
        const form = await getPromotionFormData();
        setFormData(form.data.form_fields || form.data.formData || null);
      } catch (formErr: any) {
        console.error('Failed to load promotion form data:', formErr, formErr?.response?.data);
        const serverMsg = formErr?.response?.data?.message || formErr?.response?.data?.error || formErr?.message || 'Promotion form data could not be loaded';
        toast.error(serverMsg);
      }
    } catch (err: any) {
      console.error('Unexpected fetch error:', err);
      toast.error(err.response?.data?.message || 'Failed to load promotion data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await applyPromotion({ reason });
      toast.success('Promotion application submitted successfully');
      setShowForm(false);
      setReason('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const closeDocForm = () => {
    setShowDocForm(null);
    setDocResultMsg(null);
    setDocumentType('qualification');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload, wait for OCR + blockchain checks to finish, then submit the
  // result to the promotion application — all in one step, no separate
  // "Documents" page needed.
  const handleUploadAndSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const applicationId = showDocForm;
    if (!file || !applicationId) return;

    setUploadingDoc(true);
    setDocResultMsg(null);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('document_type', documentType);
      const uploadRes = await uploadDocument(formData);
      const documentId = uploadRes.data.document.id;

      let doc = uploadRes.data.document;
      for (let i = 0; i < 12 && doc.ocr_status === 'pending'; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const res = await getDocumentById(documentId);
        doc = res.data.document ?? res.data;
      }

      if (doc.ocr_status !== 'completed') {
        toast.error('Could not process this document. Try uploading a clearer photo or scan.');
        return;
      }

      const submitRes = await submitPromotionDocument(applicationId, documentId);
      const result = submitRes.data.ocr_result;

      if (result.auto_decision === 'approved') {
        toast.success(submitRes.data.message);
        closeDocForm();
        fetchData();
      } else if (result.can_retry) {
        setDocResultMsg({ kind: 'retry', text: submitRes.data.message });
      } else {
        toast(submitRes.data.message, { icon: '🕓' });
        closeDocForm();
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <Layout><Spinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Promotion Applications</h2>
          <p className="text-gray-500 text-sm">Check eligibility and apply for promotion</p>
        </div>

        {/* Eligibility Card */}
        <div className={`rounded-xl p-5 border-2 ${
          hasActiveApplication
            ? applicationStatus === 'approved'
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
            : eligibility?.eligible
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {hasActiveApplication ? (
              applicationStatus === 'approved'
                ? <CheckCircle size={24} className="text-green-600 shrink-0 mt-0.5" />
                : <TrendingUp size={24} className="text-yellow-600 shrink-0 mt-0.5" />
            ) : eligibility?.eligible ? (
              <CheckCircle size={24} className="text-green-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={24} className="text-red-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`font-bold text-base ${
                hasActiveApplication
                  ? applicationStatus === 'approved'
                    ? 'text-green-800'
                    : 'text-yellow-800'
                  : eligibility?.eligible
                    ? 'text-green-800'
                    : 'text-red-700'
              }`}>
                {hasActiveApplication
                  ? applicationStatus === 'approved'
                    ? 'Your promotion has been approved'
                    : applicationStatus === 'pending'
                      ? 'Promotion application pending review'
                      : 'Promotion application requires more information'
                  : eligibilityLoaded
                    ? eligibility?.eligible
                      ? `You are eligible for promotion to ${eligibility.nextGrade}`
                      : 'You are not eligible for promotion yet'
                    : 'Unable to confirm promotion eligibility'
                }
              </h3>
              {hasActiveApplication ? (
                <p className="text-yellow-700 text-sm mt-1">Your latest application is currently <strong>{applicationStatus}</strong>.</p>
              ) : (!eligibilityLoaded ? (
                <p className="text-red-600 text-sm mt-1">Could not load eligibility at this time. Please refresh or try again later.</p>
              ) : (!eligibility?.eligible && (
                <p className="text-red-600 text-sm mt-1">{eligibility?.reason}</p>
              )))}
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <span className="text-gray-600">
                  Current Grade: <strong>{eligibility?.teacher?.current_grade}</strong>
                </span>
                <span className="text-gray-600">
                  Years of Service: <strong>{eligibility?.teacher?.years_of_service}</strong>
                </span>
                <span className="text-gray-600">
                  Qualification: <strong>{eligibility?.teacher?.qualification}</strong>
                </span>
              </div>
              {!hasActiveApplication && eligibility?.eligible && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm transition"
                >
                  Apply for Promotion
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Application Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-800">Apply for Promotion</h3>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {(() => {
                  const profile = formData ?? eligibility?.teacher ?? {};
                  return (
                    <>
                      <div>
                        <p className="text-xs text-gray-400">Name</p>
                        <p className="font-medium text-gray-800">
                          {profile.first_name && profile.last_name
                            ? `${profile.first_name} ${profile.last_name}`
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Staff ID</p>
                        <p className="font-medium text-gray-800">{profile.staff_id || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Current Grade</p>
                        <p className="font-medium text-gray-800">{profile.current_grade || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Years of Service</p>
                        <p className="font-medium text-gray-800">
                          {profile.years_of_service ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Qualification</p>
                        <p className="font-medium text-gray-800">{profile.qualification || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Current School</p>
                        <p className="font-medium text-gray-800">{profile.current_school || '—'}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Promotion
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    rows={4}
                    placeholder="Explain why you deserve this promotion..."
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-lg text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Submission Modal */}
        {showDocForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-800">Submit Supporting Document</h3>
                <button onClick={closeDocForm}>
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 mb-4 text-sm text-amber-700">
                <p className="font-medium mb-1">How this works:</p>
                <p>We automatically anchor your document on the blockchain, run OCR to check your
                  name/staff ID, and — for qualifications/licenses — cross-check it against GTEC/NTC's
                  records. If it checks out, you get exam access immediately.</p>
              </div>

              {docResultMsg ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">
                  <p className="font-medium mb-1">This document couldn't be verified</p>
                  <p>{docResultMsg.text}</p>
                </div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    disabled={uploadingDoc}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeDocForm}
                    disabled={uploadingDoc}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm cursor-pointer transition ${
                    uploadingDoc
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}>
                    <Upload size={14} />
                    {uploadingDoc ? 'Verifying...' : docResultMsg ? 'Upload Correct Document' : 'Upload Document'}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      disabled={uploadingDoc}
                      onChange={handleUploadAndSubmit}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Applications List */}
        {promotions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <TrendingUp size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No promotion applications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Application History</h3>
            {promotions.map((app) => (
              <div key={app.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TrendingUp size={16} className="text-amber-600" />
                      <span className="font-semibold text-gray-800">Promotion Application</span>
                      <Badge status={app.status} />
                    </div>
                    <p className="text-sm text-gray-500">{app.reason}</p>
                    <p className="text-xs text-gray-400">
                      Submitted: {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Submit document button for pending applications */}
                    {(app.status === 'pending' || app.status === 'more_info') && (
                      <button
                        onClick={() => setShowDocForm(app.id)}
                        className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2 rounded-lg text-sm transition"
                      >
                        <Upload size={14} />
                        Submit Document
                      </button>
                    )}
                    {app.hr_notes && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-sm text-amber-800 max-w-xs">
                        <p className="font-medium mb-1">HR Notes:</p>
                        <p>{app.hr_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Promotions;