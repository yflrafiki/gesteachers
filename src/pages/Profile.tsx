import { useState, useEffect, useRef } from 'react';
import { getMyProfile, updateMyProfile } from '../api/teachers';
import Layout from '../components/layout/Layout';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';
import { changePassword } from '../api/auth';
import {
  User, Edit, Save, X, Camera,
  ChevronDown, ChevronUp, Lock
} from 'lucide-react';

const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Rev', 'Alhaji', 'Madam'];
const QUALIFICATIONS = ['Certificate', 'Diploma', 'B.Ed', 'B.A', 'B.Sc', 'M.Ed', 'M.A', 'M.Sc', 'PhD'];
const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed', 'separated'];

// ---- Section wrapper ----
const Section = ({
  title, children, defaultOpen = true
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition"
      >
        <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          {title}
        </span>
        {open
          ? <ChevronUp size={16} className="text-gray-400" />
          : <ChevronDown size={16} className="text-gray-400" />
        }
      </button>
      {open && (
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ---- Display field (read-only) ----
const InfoField = ({ label, value }: { label: string; value: any }) => {
  const display = () => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string' && value.includes('T') && value.includes('-')) {
      return value.split('T')[0];
    }
    return String(value);
  };
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{display()}</p>
    </div>
  );
};

// ---- Editable field ----
const EditField = ({
  label, field, value, onChange,
  type = 'text', options, fullWidth = false
}: {
  label: string;
  field: string;
  value: any;
  onChange: (field: string, value: any) => void;
  type?: string;
  options?: string[];
  fullWidth?: boolean;
}) => {
  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {type === 'select' && options ? (
        <select
          value={value ?? ''}
          onChange={(e) => onChange(field, e.target.value)}
          className={cls}
        >
          <option value="">Select...</option>
          {options.map(o => (
            <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <div className="flex items-center gap-3 mt-1">
          <input
            type="checkbox"
            checked={value ?? false}
            onChange={(e) => onChange(field, e.target.checked)}
            className="w-5 h-5 accent-blue-600 cursor-pointer"
          />
          <span className="text-sm text-gray-600">Yes</span>
        </div>
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(
            field,
            type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
          )}
          className={cls}
        />
      )}
    </div>
  );
};

// ============================================================
const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<any>({});

  // Password change state
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPw, setChangingPw] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await getMyProfile();
      const data = res.data;
      setProfile(data);
      resetForm(data);
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (data: any) => {
    setForm({
      title: data.title || '',
      date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
      phone: data.phone || '',
      gender: data.gender || '',
      marital_status: data.marital_status || '',
      nationality: data.nationality || '',
      hometown: data.hometown || '',
      subject_specialization: data.subject_specialization || '',
      qualification: data.qualification || '',
      national_date_of_present_rank: data.national_date_of_present_rank
        ? data.national_date_of_present_rank.split('T')[0] : '',
      years_in_current_rank: data.years_in_current_rank || 0,
      disability_status: data.disability_status || false,
      disability_type: data.disability_type || '',
    });
  };

  useEffect(() => { loadProfile(); }, []);

  const update = (field: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [field]: value }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, String(value));
        }
      });
      if (photoFile) formData.append('passport_photo', photoFile);
      const res = await updateMyProfile(formData);
      setProfile(res.data.teacher);
      resetForm(res.data.teacher);
      setEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (profile) resetForm(profile);
  };

  const handleChangePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error('New passwords do not match'); return;
    }
    if (pwForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setChangingPw(true);
    try {
      await changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password
      });
      toast.success('Password changed successfully');
      setShowPwForm(false);
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) return <Layout><Spinner /></Layout>;

  const photoSrc = photoPreview ||
    (profile?.passport_photo
      ? `http://localhost:5000/${profile.passport_photo}`
      : null);

  const employmentStatus = profile?.employment_status || 'active';

  return (
    <Layout>
      <div className="space-y-5 max-w-4xl mx-auto">

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
              <Edit size={16} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">
                <X size={16} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Profile Banner */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 h-24 md:h-28" />
          <div className="px-5 md:px-8 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-4">
              {/* Photo */}
              <div className="relative w-fit">
                <div className="bg-white rounded-full p-1 shadow-lg">
                  {photoSrc ? (
                    <img src={photoSrc} alt="Passport"
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <div className="bg-blue-100 rounded-full w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                      <User size={36} className="text-blue-700" />
                    </div>
                  )}
                </div>
                {editing && (
                  <>
                    <button onClick={() => photoRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-blue-700 text-white rounded-full p-1.5 shadow-lg hover:bg-blue-800 transition">
                      <Camera size={14} />
                    </button>
                    <input ref={photoRef} type="file" accept="image/*"
                      onChange={handlePhotoChange} className="hidden" />
                  </>
                )}
              </div>
              {/* Name */}
              <div className="pb-2 flex-1">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">
                  {profile?.title} {profile?.first_name} {profile?.last_name}
                </h3>
                <p className="text-gray-500 text-sm">{profile?.staff_id} · {profile?.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    employmentStatus === 'active' ? 'bg-green-100 text-green-700' :
                    employmentStatus === 'on_leave' ? 'bg-yellow-100 text-yellow-700' :
                    employmentStatus === 'suspended' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {employmentStatus.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {profile?.current_grade}
                  </span>
                </div>
              </div>
            </div>
            {editing && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                Employment details (school, district, grade, appointment dates) are managed by HR.
                You can update all personal and professional details.
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <Section title="Personal Information">
          {editing ? (
            <>
              <EditField label="Title" field="title" value={form.title}
                onChange={update} type="select" options={TITLES} />
              <EditField label="Date of Birth" field="date_of_birth"
                value={form.date_of_birth} onChange={update} type="date" />
              <EditField label="Phone Number" field="phone"
                value={form.phone} onChange={update} type="tel" />
              <EditField label="Gender" field="gender" value={form.gender}
                onChange={update} type="select" options={['Male', 'Female']} />
              <EditField label="Marital Status" field="marital_status"
                value={form.marital_status} onChange={update}
                type="select" options={MARITAL_STATUSES} />
              <EditField label="Nationality" field="nationality"
                value={form.nationality} onChange={update} />
              <EditField label="Hometown" field="hometown"
                value={form.hometown} onChange={update} />
            </>
          ) : (
            <>
              <InfoField label="Title" value={profile?.title} />
              <InfoField label="Date of Birth" value={profile?.date_of_birth} />
              <InfoField label="Phone Number" value={profile?.phone} />
              <InfoField label="Gender" value={profile?.gender} />
              <InfoField label="Marital Status" value={profile?.marital_status} />
              <InfoField label="Nationality" value={profile?.nationality} />
              <InfoField label="Hometown" value={profile?.hometown} />
            </>
          )}
        </Section>

        {/* Professional Information */}
        <Section title="Professional Information">
          {editing ? (
            <>
              <EditField label="Subject Specialization" field="subject_specialization"
                value={form.subject_specialization} onChange={update} />
              <EditField label="Qualification" field="qualification"
                value={form.qualification} onChange={update}
                type="select" options={QUALIFICATIONS} />
              <InfoField label="Current Grade / Rank (HR managed)" value={profile?.current_grade} />
              <InfoField label="Years of Service (HR managed)" value={profile?.years_of_service} />
              <EditField label="National Date of Present Rank"
                field="national_date_of_present_rank"
                value={form.national_date_of_present_rank} onChange={update} type="date" />
              <EditField label="Years in Current Rank"
                field="years_in_current_rank"
                value={form.years_in_current_rank} onChange={update} type="number" />
            </>
          ) : (
            <>
              <InfoField label="Subject Specialization" value={profile?.subject_specialization} />
              <InfoField label="Qualification" value={profile?.qualification} />
              <InfoField label="Current Grade / Rank" value={profile?.current_grade} />
              <InfoField label="Years of Service" value={profile?.years_of_service} />
              <InfoField label="National Date of Present Rank"
                value={profile?.national_date_of_present_rank} />
              <InfoField label="Years in Current Rank"
                value={profile?.years_in_current_rank} />
            </>
          )}
        </Section>

        {/* Employment Details — always read only for teacher */}
        <Section title="Employment Details" defaultOpen={false}>
          <InfoField label="Current School" value={profile?.current_school} />
          <InfoField label="Current District" value={profile?.current_district} />
          <InfoField label="Current Region" value={profile?.current_region} />
          <InfoField label="Date of First Appointment" value={profile?.date_of_first_appointment} />
          <InfoField label="Date of Confirmation" value={profile?.date_of_confirmation} />
          <InfoField label="Date of Current Posting" value={profile?.date_of_current_posting} />
          <InfoField label="Employment Status" value={profile?.employment_status} />
        </Section>

        {/* Diversity & Health */}
        <Section title="Diversity & Health" defaultOpen={false}>
          {editing ? (
            <>
              <EditField label="Do you have a disability?" field="disability_status"
                value={form.disability_status} onChange={update}
                type="checkbox" fullWidth />
              {form.disability_status && (
                <EditField label="Disability Type / Description"
                  field="disability_type" value={form.disability_type}
                  onChange={update} fullWidth />
              )}
            </>
          ) : (
            <>
              <InfoField label="Disability Status" value={profile?.disability_status} />
              {profile?.disability_status && (
                <InfoField label="Disability Type" value={profile?.disability_type} />
              )}
            </>
          )}
        </Section>

        {/* Change Password */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowPwForm(!showPwForm)}
            className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-gray-500" />
              <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                Change Password
              </span>
            </div>
            {showPwForm
              ? <ChevronUp size={16} className="text-gray-400" />
              : <ChevronDown size={16} className="text-gray-400" />
            }
          </button>
          {showPwForm && (
            <div className="p-5 space-y-4">
              {[
                { label: 'Current Password', field: 'current_password' },
                { label: 'New Password', field: 'new_password' },
                { label: 'Confirm New Password', field: 'confirm_password' },
              ].map(({ label, field }) => (
                <div key={field}>
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <input
                    type="password"
                    value={(pwForm as any)[field]}
                    onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={label}
                  />
                </div>
              ))}
              <div className="flex gap-3">
                <button onClick={() => setShowPwForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm">
                  Cancel
                </button>
                <button onClick={handleChangePassword} disabled={changingPw}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                  {changingPw ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default Profile;