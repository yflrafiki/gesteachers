import { useState, useEffect, useRef } from 'react';
import { checkEligibility, getPromotionFormData, applyPromotion, getMyPromotions, submitPromotionDocument } from '../api/promotions';
import { uploadDocument, getDocumentById } from '../api/documents';
import Layout from '../components/layout/Layout';
import { CardListSkeleton } from '../components/common/Skeleton';
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
  const [submitting, setSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState('qualification');
  const [docResultMsg, setDocResultMsg] = useState<{ kind: 'retry' | 'review'; text: string } | null>(null);

  // The application form's own required document — a supporting document is
  // now attached at the point of applying, not as a separate later step.
  const [applyDocument, setApplyDocument] = useState<File | null>(null);
  // Picking a file doesn't immediately trigger OCR/blockchain verification —
  // the teacher reviews what they picked and explicitly confirms first, so a
  // wrong file can be swapped out before it's actually checked.
  const [documentConfirmed, setDocumentConfirmed] = useState(false);
  const [pendingApplicationId, setPendingApplicationId] = useState<string | null>(null);
  const applyFileInputRef = useRef<HTMLInputElement>(null);

  const latestApplication: any = promotions[0] ?? null;
  const applicationStatus = latestApplication?.status;
  const hasActiveApplication = ['pending', 'more_info', 'approved'].includes(applicationStatus);

  // True if the latest application still needs a document submitted (or
  // resubmitted after a failed check) — derived from server data, not local
  // state, so a page refresh mid-upload doesn't strand the teacher with no
  // way to continue. They'd otherwise be stuck: the application already
  // exists so "Apply" is hidden, but nothing would let them attach a document.
  const needsDocument = hasActiveApplication
    && applicationStatus !== 'approved'
    && (!latestApplication?.promotion_document_id || latestApplication?.hr_decision === 'retry');

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
        setFormData(form.data.teacher || null);
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

  const closeApplyForm = () => {
    setShowForm(false);
    setApplyDocument(null);
    setDocumentConfirmed(false);
    setPendingApplicationId(null);
    setDocResultMsg(null);
    setDocumentType('qualification');
    if (applyFileInputRef.current) applyFileInputRef.current.value = '';
  };

  // Lets the teacher swap out the file they picked before it's actually
  // verified — goes back to the picker step without losing the in-progress
  // application or document type selection.
  const changeApplyDocument = () => {
    setApplyDocument(null);
    setDocumentConfirmed(false);
    if (applyFileInputRef.current) applyFileInputRef.current.value = '';
  };

  // Opens the application modal. When continuing an existing application
  // (after a refresh, or a previous attempt that needs a retry), pass its
  // ID so the upload step attaches to that application instead of creating
  // a new one — applying again would otherwise be rejected as a duplicate.
  const openApplyForm = (continueApplicationId?: string) => {
    setPendingApplicationId(continueApplicationId || null);
    setShowForm(true);
  };

  // Creates the application (only once — a retry after a failed check reuses
  // the same application instead of creating a duplicate), then immediately
  // uploads the attached document and runs it through the same OCR +
  // blockchain check used everywhere else.
  const handleApplySubmit = async () => {
    if (!applyDocument) {
      toast.error('Please attach a supporting document');
      return;
    }

    setSubmitting(true);
    setDocResultMsg(null);
    try {
      let applicationId = pendingApplicationId;
      if (!applicationId) {
        const appRes = await applyPromotion({});
        applicationId = appRes.data.application.id;
        setPendingApplicationId(applicationId);
      }
      if (!applicationId) return;

      const formData = new FormData();
      formData.append('document', applyDocument);
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
        closeApplyForm();
        fetchData();
      } else if (result.can_retry) {
        setDocResultMsg({ kind: 'retry', text: submitRes.data.message });
        setApplyDocument(null);
        setDocumentConfirmed(false);
        if (applyFileInputRef.current) applyFileInputRef.current.value = '';
      } else {
        toast(submitRes.data.message, { icon: '🕓' });
        closeApplyForm();
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><CardListSkeleton /></Layout>;

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
                  onClick={() => openApplyForm()}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm transition"
                >
                  Apply for Promotion
                </button>
              )}
              {needsDocument && (
                <button
                  onClick={() => openApplyForm(latestApplication.id)}
                  className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-sm transition"
                >
                  {latestApplication?.hr_decision === 'retry' ? 'Upload Correct Document' : 'Continue — Submit Document'}
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
                <button onClick={closeApplyForm}>
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

              <div className="bg-amber-50 rounded-lg p-3 mb-4 text-sm text-amber-700">
                <p className="font-medium mb-1">How this works:</p>
                <p>Your document is automatically anchored on the blockchain, checked by OCR
                  against your profile, and — for qualifications/licenses — cross-checked against
                  GTEC/NTC's records. If it checks out, your application goes through immediately.</p>
              </div>

              {docResultMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">
                  <p className="font-medium mb-1">This document couldn't be verified</p>
                  <p>{docResultMsg.text}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    disabled={submitting || documentConfirmed}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {!documentConfirmed ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supporting Document <span className="text-red-500">*</span>
                    </label>
                    <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2.5 text-sm cursor-pointer hover:border-amber-400 transition">
                      <Upload size={14} className="text-gray-400 shrink-0" />
                      <span className="truncate text-gray-600">
                        {applyDocument ? applyDocument.name : (docResultMsg ? 'Upload the correct document...' : 'Choose a file...')}
                      </span>
                      <input
                        ref={applyFileInputRef}
                        type="file"
                        className="hidden"
                        disabled={submitting}
                        onChange={(e) => setApplyDocument(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                ) : (
                  // A picked file isn't checked immediately — the teacher
                  // confirms it's the right one first, since once "Submit"
                  // is pressed the OCR/blockchain check runs right away.
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle size={16} className="text-blue-600 shrink-0" />
                      <span className="text-sm text-blue-800 truncate">{applyDocument?.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={changeApplyDocument}
                      disabled={submitting}
                      className="text-xs font-medium text-blue-700 hover:underline shrink-0 disabled:opacity-50"
                    >
                      Change File
                    </button>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeApplyForm}
                    disabled={submitting}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  {!documentConfirmed ? (
                    <button
                      type="button"
                      onClick={() => setDocumentConfirmed(true)}
                      disabled={!applyDocument}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-lg text-sm disabled:opacity-50"
                    >
                      Review Document
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplySubmit}
                      disabled={submitting}
                      className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-lg text-sm disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Confirm & Submit'}
                    </button>
                  )}
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
                    {app.reason && <p className="text-sm text-gray-500">{app.reason}</p>}
                    <p className="text-xs text-gray-400">
                      Submitted: {new Date(app.created_at).toLocaleString()}
                    </p>
                    {app.reviewed_at && (
                      <p className="text-xs text-gray-400">
                        {app.status === 'approved' ? 'Approved' : app.status === 'rejected' ? 'Rejected' : 'Reviewed'}: {new Date(app.reviewed_at).toLocaleString()}
                      </p>
                    )}

                    {/* What was actually submitted, and its verification status —
                        pulled from the server so it survives a page refresh. */}
                    {app.document_file_name ? (
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <Upload size={12} className="text-gray-400" />
                        <span className="text-gray-600">{app.document_file_name}</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          app.hr_decision === 'approved' ? 'bg-green-100 text-green-700'
                          : app.hr_decision === 'retry' ? 'bg-red-100 text-red-700'
                          : app.hr_decision === 'manual_review' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                          {app.hr_decision === 'approved' ? 'Verified'
                            : app.hr_decision === 'retry' ? 'Needs re-upload'
                            : app.hr_decision === 'manual_review' ? 'Under HR review'
                            : app.document_ocr_status === 'pending' ? 'Still processing...'
                            : app.hr_decision || 'Submitted'}
                        </span>
                      </div>
                    ) : (app.status === 'pending' || app.status === 'more_info') && (
                      <p className="text-xs text-amber-600 mt-1">No document submitted yet</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
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