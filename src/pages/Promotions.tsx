import { useState, useEffect } from 'react';
import { checkEligibility, applyPromotion, getMyPromotions } from '../api/promotions';
import Layout from '../components/layout/Layout';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import { type Application } from '../types/index';
import toast from 'react-hot-toast';
import { TrendingUp, CheckCircle, XCircle, X } from 'lucide-react';

const Promotions = () => {
  const [promotions, setPromotions] = useState<Application[]>([]);
  const [eligibility, setEligibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');

  const fetchData = async () => {
    try {
      const [el, pr] = await Promise.all([
        checkEligibility(),
        getMyPromotions(),
      ]);
      setEligibility(el.data);
      setPromotions(pr.data.applications);
    } catch (err) {
      toast.error('Failed to load promotion data');
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
          eligibility?.eligible
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {eligibility?.eligible
              ? <CheckCircle size={24} className="text-green-600 shrink-0 mt-0.5" />
              : <XCircle size={24} className="text-red-500 shrink-0 mt-0.5" />
            }
            <div className="flex-1">
              <h3 className={`font-bold text-base ${
                eligibility?.eligible ? 'text-green-800' : 'text-red-700'
              }`}>
                {eligibility?.eligible
                  ? `You are eligible for promotion to ${eligibility.nextGrade}`
                  : 'You are not eligible for promotion yet'
                }
              </h3>
              {!eligibility?.eligible && (
                <p className="text-red-600 text-sm mt-1">{eligibility?.reason}</p>
              )}
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
              {eligibility?.eligible && (
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
                  <X size={20} className="text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Promotion
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-600" />
                      <span className="font-semibold text-gray-800">Promotion Application</span>
                      <Badge status={app.status} />
                    </div>
                    <p className="text-sm text-gray-500">{app.reason}</p>
                    <p className="text-xs text-gray-400">
                      Submitted: {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    {app.reviewed_at && (
                      <p className="text-xs text-gray-400">
                        Reviewed: {new Date(app.reviewed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {app.hr_notes && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800 max-w-xs">
                      <p className="font-medium mb-1">HR Notes:</p>
                      <p>{app.hr_notes}</p>
                    </div>
                  )}
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