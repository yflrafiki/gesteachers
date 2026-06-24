import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { createChangeRequest } from '../api/changeRequests';
import toast from 'react-hot-toast';
import { Upload, FileText, ArrowLeft, X } from 'lucide-react';

interface RequestChangeState {
  field: string;
  label: string;
  value: any;
  type?: string;
  options?: string[];
}

// Professional info (what/where you teach) doesn't need notarized proof —
// personal/identity fields do. Must match FIELDS_NOT_REQUIRING_DOCUMENT in
// ges/src/controllers/changeRequestController.js.
const FIELDS_NOT_REQUIRING_DOCUMENT = ['subject_specialization', 'qualification'];

const RequestChange = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as RequestChangeState | undefined;

  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reached directly without going through Profile's "Request change" link —
  // there's no field context to work with, so send them back.
  if (!state?.field) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm p-8 text-center space-y-3">
          <p className="text-gray-600">No field selected to request a change for.</p>
          <Link to="/profile" className="text-amber-600 hover:underline text-sm font-medium">
            Back to My Profile
          </Link>
        </div>
      </Layout>
    );
  }

  const { field, label, value, type = 'text', options } = state;
  const requiresDocument = !FIELDS_NOT_REQUIRING_DOCUMENT.includes(field);

  const currentDisplay = () => {
    if (value === null || value === undefined || value === '') return '—';
    if (type === 'checkbox') return value ? 'Yes' : 'No';
    if (typeof value === 'string' && value.includes('T')) return value.split('T')[0];
    return String(value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Document must be under 5MB'); return; }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) { toast.error('Enter the new value'); return; }
    if (requiresDocument && !file) { toast.error('Attach a supporting document (affidavit)'); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('field_name', field);
      formData.append('requested_value', newValue);
      if (reason) formData.append('reason', reason);
      if (file) formData.append('document', file);

      await createChangeRequest(formData);
      toast.success('Change request submitted for HR approval');
      navigate('/profile');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit change request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-5">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={14} /> Back to Profile
        </button>

        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Request Change: {label}</h2>
          <p className="text-gray-500 text-sm">
            {requiresDocument
              ? 'This requires HR approval and a supporting document (affidavit) — attach one with your request.'
              : 'This requires HR approval. No supporting document is needed for professional information.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Current Value</p>
            <p className="text-sm font-medium text-gray-800">{currentDisplay()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New {label} <span className="text-red-500">*</span>
            </label>
            {type === 'select' && options ? (
              <select
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="">Select...</option>
                {options.map((o) => (
                  <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
                ))}
              </select>
            ) : type === 'checkbox' ? (
              <select
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="">Select...</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : (
              <input
                type={type}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder={`Enter new ${label.toLowerCase()}`}
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Why are you requesting this change?"
            />
          </div>

          {requiresDocument && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supporting Document / Affidavit <span className="text-red-500">*</span>
              </label>
              {file ? (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-amber-800 truncate">
                    <FileText size={16} className="shrink-0" />
                    {file.name}
                  </span>
                  <button type="button" onClick={() => setFile(null)} className="text-amber-700 hover:text-amber-900 shrink-0">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-amber-400 cursor-pointer transition text-sm">
                  <Upload size={16} />
                  Click to select document (JPG, PNG, PDF, DOCX — max 5MB)
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf,.docx,.doc" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default RequestChange;
