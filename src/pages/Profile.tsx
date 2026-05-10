import { useState, useEffect } from 'react';
import { getMyProfile, updateMyProfile } from '../api/teachers';
import Layout from '../components/layout/Layout';
import Spinner from '../components/common/Spinner';
import { type Teacher } from '../types/index';
import toast from 'react-hot-toast';
import { User, Edit, Save, X } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    phone: '',
    gender: '',
    subject_specialization: '',
    qualification: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyProfile();
        setProfile(res.data);
        setForm({
          phone: res.data.phone || '',
          gender: res.data.gender || '',
          subject_specialization: res.data.subject_specialization || '',
          qualification: res.data.qualification || '',
        });
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateMyProfile(form);
      setProfile(res.data.teacher);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><Spinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">My Profile</h2>
            <p className="text-gray-500 text-sm">View and update your personal information</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm transition w-fit"
            >
              <Edit size={16} />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Banner */}
          <div className="bg-blue-900 h-24 md:h-32"></div>
          <div className="px-5 md:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-6">
              <div className="bg-white rounded-full p-1 shadow-md w-fit">
                <div className="bg-blue-100 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                  <User size={32} className="text-blue-700" />
                </div>
              </div>
              <div className="pb-2">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">
                  {profile?.first_name} {profile?.last_name}
                </h3>
                <p className="text-gray-500 text-sm">{profile?.staff_id}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Non-editable fields */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2">
                  Employment Information
                </h4>
                {[
                  { label: 'Staff ID', value: profile?.staff_id },
                  { label: 'Current Grade', value: profile?.current_grade },
                  { label: 'Years of Service', value: `${profile?.years_of_service} years` },
                  { label: 'Current School', value: profile?.current_school },
                  { label: 'District', value: profile?.current_district },
                  { label: 'Region', value: profile?.current_region },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-700">{value || '—'}</p>
                  </div>
                ))}
              </div>

              {/* Editable fields */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2">
                  Personal Information
                </h4>

                {/* Phone */}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                  {editing ? (
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-700">{profile?.phone || '—'}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Gender</p>
                  {editing ? (
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-gray-700">{profile?.gender || '—'}</p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Subject Specialization</p>
                  {editing ? (
                    <input
                      type="text"
                      value={form.subject_specialization}
                      onChange={(e) => setForm({ ...form, subject_specialization: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-700">{profile?.subject_specialization || '—'}</p>
                  )}
                </div>

                {/* Qualification */}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Qualification</p>
                  {editing ? (
                    <select
                      value={form.qualification}
                      onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select qualification</option>
                      {['Certificate', 'Diploma', 'B.Ed', 'B.A', 'B.Sc', 'M.Ed', 'M.A', 'M.Sc', 'PhD'].map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-gray-700">{profile?.qualification || '—'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;