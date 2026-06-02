import { useState, useEffect } from 'react';
import { createTransfer, getMyTransfers } from '../api/transfers';
import Layout from '../components/layout/Layout';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import { type Application } from '../types/index';
import toast from 'react-hot-toast';
import { Plus, ArrowLeftRight, X } from 'lucide-react';

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Northern', 'Upper East', 'Upper West', 'Volta', 'Brong-Ahafo',
  'Savannah', 'Bono East', 'Ahafo', 'Western North', 'Oti', 'North East'
];

const Transfers = () => {
  const [transfers, setTransfers] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    reason: '',
    requested_district: '',
    requested_region: '',
  });

  const fetchTransfers = async () => {
    try {
      const res = await getMyTransfers();
      setTransfers(res.data.applications);
    } catch (err) {
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransfers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTransfer(form);
      toast.success('Transfer application submitted successfully');
      setShowForm(false);
      setForm({ reason: '', requested_district: '', requested_region: '' });
      fetchTransfers();
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Transfer Applications</h2>
            <p className="text-gray-500 text-sm">Apply and track your transfer requests</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm transition w-fit"
          >
            <Plus size={16} />
            New Application
          </button>
        </div>

        {/* Application Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-800">New Transfer Application</h3>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} className="text-gray-500 hover:text-gray-700" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requested Region
                  </label>
                  <select
                    value={form.requested_region}
                    onChange={(e) => setForm({ ...form, requested_region: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select region</option>
                    {REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requested District
                  </label>
                  <input
                    type="text"
                    value={form.requested_district}
                    onChange={(e) => setForm({ ...form, requested_district: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Accra Metropolitan"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Transfer
                  </label>
                  <textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                    placeholder="Explain why you are requesting a transfer..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-lg text-sm transition disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Applications List */}
        {transfers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <ArrowLeftRight size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No transfer applications yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "New Application" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers.map((app) => (
              <div key={app.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight size={16} className="text-amber-600" />
                      <span className="font-semibold text-gray-800">Transfer Request</span>
                      <Badge status={app.status} />
                    </div>
                    <p className="text-sm text-gray-600">
                      To: <strong>{app.requested_district}, {app.requested_region}</strong>
                    </p>
                    <p className="text-sm text-gray-500">{app.reason}</p>
                    <p className="text-xs text-gray-400">
                      Submitted: {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {app.hr_notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-sm text-amber-800 max-w-xs">
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

export default Transfers;