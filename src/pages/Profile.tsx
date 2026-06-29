import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, updateMyProfile } from '../api/teachers';
import { getMyChangeRequests, getChangeRequestDocument } from '../api/changeRequests';
import Layout from '../components/layout/Layout';
import { FormSkeleton } from '../components/common/Skeleton';
import toast from 'react-hot-toast';
import {
  User, Edit, Save, X, Camera,
  ChevronDown, ChevronUp, Clock
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
const InfoField = ({ label, value, type }: { label: string; value: any; type?: string }) => {
  const displayValue = () => {
    if (value === null || value === undefined || value === '') return '—';
    if (type === 'checkbox') return value ? 'Yes' : 'No';
    if (typeof value === 'string' && value.includes('T')) return value.split('T')[0];
    return String(value);
  };
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{displayValue()}</p>
    </div>
  );
};

// ---- Editable field (for the two fields teachers may change directly) ----
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
  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";
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
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(field, e.target.value)}
          className={cls}
        />
      )}
    </div>
  );
};

// ---- Field that requires HR approval to change — sends teacher to a
// dedicated page where they enter the new value and attach a supporting
// affidavit document, rather than expanding inline. ----
const RequestChangeField = ({
  label, value, field, type = 'text', options, pending, fullWidth = false
}: {
  label: string;
  value: any;
  field: string;
  type?: string;
  options?: string[];
  pending?: { requested_value: string };
  fullWidth?: boolean;
}) => {
  const navigate = useNavigate();

  const displayValue = () => {
    if (value === null || value === undefined || value === '') return '—';
    if (type === 'checkbox') return value ? 'Yes' : 'No';
    if (typeof value === 'string' && value.includes('T')) return value.split('T')[0];
    return String(value);
  };

  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        {!pending && (
          <button
            onClick={() => navigate('/profile/request-change', { state: { field, label, value, type, options } })}
            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
          >
            Request change
          </button>
        )}
      </div>
      <p className="text-sm font-medium text-gray-800">{displayValue()}</p>
      {pending && (
        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
          <Clock size={12} /> Pending HR approval: "{pending.requested_value}"
        </p>
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<any>({});
  const [myRequests, setMyRequests] = useState<any[]>([]);

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

  const loadChangeRequests = async () => {
    try {
      const res = await getMyChangeRequests();
      setMyRequests(res.data.requests || []);
    } catch (err) {
      // non-fatal — profile still usable without request history
    }
  };

  const resetForm = (data: any) => {
    setForm({
      phone: data.phone || '',
      marital_status: data.marital_status || '',
    });
  };

  useEffect(() => { loadProfile(); loadChangeRequests(); }, []);

  const update = (field: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [field]: value }));

  // Photo upload is independent of the "Edit Phone / Marital Status" form —
  // selecting a file uploads it immediately, no separate Save step needed.
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return; }
    setPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('passport_photo', file);
      const res = await updateMyProfile(formData);
      setProfile(res.data.teacher);
      toast.success('Profile photo updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Photo upload failed');
    } finally {
      setUploadingPhoto(false);
      setPhotoPreview(null);
      if (photoRef.current) photoRef.current.value = '';
    }
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
      const res = await updateMyProfile(formData);
      setProfile(res.data.teacher);
      resetForm(res.data.teacher);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) resetForm(profile);
  };

  const handleViewDocument = async (requestId: string) => {
    try {
      const res = await getChangeRequestDocument(requestId);
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch (err: any) {
      toast.error('Failed to load document');
    }
  };

  if (loading) return <Layout><FormSkeleton /></Layout>;

  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$|\/$/g, '') || 'http://localhost:5000';
  const photoSrc = photoPreview ||
    (profile?.passport_photo_url
      ? profile.passport_photo_url
      : profile?.passport_photo
        ? `${apiBaseUrl}/${profile.passport_photo}`
        : null);

  const employmentStatus = profile?.employment_status || 'active';

  const pendingByField: Record<string, any> = {};
  myRequests.filter(r => r.status === 'pending').forEach(r => { pendingByField[r.field_name] = r; });

  return (
    <Layout>
      <div className="space-y-5 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">My Profile</h2>
            <p className="text-gray-500 text-sm">View your information and request HR-approved changes</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm transition w-fit"
            >
              <Edit size={16} /> Edit Phone / Marital Status
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
        <div className="bg-white rounded-xl shadow-sm overflow-visible">
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 h-24 sm:h-28 md:h-32" />
          <div className="px-4 sm:px-5 md:px-8 pb-5">
            <div className="flex flex-col items-center sm:flex-row sm:items-end sm:justify-between gap-3 -mt-16 sm:-mt-14 md:-mt-16 mb-4">
              <div className="relative flex-shrink-0">
                <div className="bg-white rounded-full p-1.5 shadow-lg">
                  {photoSrc ? (
                    <img src={photoSrc} alt="Passport"
                      className="w-28 h-28 xs:w-32 xs:h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <div className="bg-amber-50 rounded-full w-28 h-28 xs:w-32 xs:h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 flex items-center justify-center">
                      <User size={44} className="text-amber-700" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => photoRef.current?.click()}
                  disabled={uploadingPhoto}
                  title="Change profile photo"
                  className="absolute bottom-1 right-1 bg-amber-600 text-white rounded-full p-2 shadow-lg hover:bg-amber-700 transition disabled:opacity-50"
                >
                  <Camera size={15} />
                </button>
                <input ref={photoRef} type="file" accept="image/*"
                  onChange={handlePhotoChange} className="hidden" disabled={uploadingPhoto} />
              </div>
              <div className="pb-2 flex-1 min-w-0 text-center sm:text-left mt-2 sm:mt-0">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 truncate">
                  {profile?.title} {profile?.first_name} {profile?.last_name}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm truncate">{profile?.staff_id} · {profile?.email}</p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    employmentStatus === 'active' ? 'bg-green-100 text-green-700' :
                    employmentStatus === 'on_leave' ? 'bg-yellow-100 text-yellow-700' :
                    employmentStatus === 'suspended' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {employmentStatus.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {profile?.current_grade}
                  </span>
                </div>
              </div>
            </div>
            {editing && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
                You can directly update your phone number and marital status. All other details
                require a change request approved by HR — use "Request change" next to each field below.
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <Section title="Personal Information">
          <RequestChangeField label="First Name" field="first_name" value={profile?.first_name}
            pending={pendingByField['first_name']} />
          <RequestChangeField label="Last Name" field="last_name" value={profile?.last_name}
            pending={pendingByField['last_name']} />
          <RequestChangeField label="Title" field="title" value={profile?.title}
            type="select" options={TITLES} pending={pendingByField['title']} />
          <RequestChangeField label="Date of Birth" field="date_of_birth" value={profile?.date_of_birth}
            type="date" pending={pendingByField['date_of_birth']} />
          {editing ? (
            <EditField label="Phone Number" field="phone" value={form.phone} onChange={update} type="tel" />
          ) : (
            <InfoField label="Phone Number" value={profile?.phone} />
          )}
          <RequestChangeField label="Gender" field="gender" value={profile?.gender}
            type="select" options={['Male', 'Female']} pending={pendingByField['gender']} />
          {editing ? (
            <EditField label="Marital Status" field="marital_status" value={form.marital_status}
              onChange={update} type="select" options={MARITAL_STATUSES} />
          ) : (
            <InfoField label="Marital Status" value={profile?.marital_status} />
          )}
          <RequestChangeField label="Nationality" field="nationality" value={profile?.nationality}
            pending={pendingByField['nationality']} />
          <RequestChangeField label="Hometown (Where you're from)" field="hometown" value={profile?.hometown}
            pending={pendingByField['hometown']} />
          <RequestChangeField label="House Number" field="house_number" value={profile?.house_number}
            pending={pendingByField['house_number']} />
        </Section>

        {/* Identification */}
        <Section title="Identification" defaultOpen={false}>
          <RequestChangeField label="Ghana Card Number" field="ghana_card_number" value={profile?.ghana_card_number}
            pending={pendingByField['ghana_card_number']} />
          <RequestChangeField label="Ghana Card Issue Date" field="ghana_card_issue_date" type="date"
            value={profile?.ghana_card_issue_date} pending={pendingByField['ghana_card_issue_date']} />
          <RequestChangeField label="Ghana Card Expiry Date" field="ghana_card_expiry_date" type="date"
            value={profile?.ghana_card_expiry_date} pending={pendingByField['ghana_card_expiry_date']} />
        </Section>

        {/* Professional Information */}
        <Section title="Professional Information">
          <RequestChangeField label="Subject Specialization" field="subject_specialization"
            value={profile?.subject_specialization} pending={pendingByField['subject_specialization']} />
          <RequestChangeField label="Qualification" field="qualification" value={profile?.qualification}
            type="select" options={QUALIFICATIONS} pending={pendingByField['qualification']} />
          <InfoField label="Current Grade / Rank (HR managed)" value={profile?.current_grade} />
          <InfoField label="Years of Service (auto-calculated)" value={profile?.years_of_service} />
          <InfoField label="National Date of Present Rank (HR managed)" value={profile?.national_date_of_present_rank} />
          <InfoField label="Years in Current Rank (auto-calculated)" value={profile?.years_in_current_rank} />
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
          <RequestChangeField label="Do you have a disability?" field="disability_status"
            value={profile?.disability_status} type="checkbox" fullWidth
            pending={pendingByField['disability_status']} />
          <RequestChangeField label="Disability Type / Description" field="disability_type"
            value={profile?.disability_type} fullWidth
            pending={pendingByField['disability_type']} />
        </Section>

        {/* Change Request History */}
        {myRequests.length > 0 && (
          <Section title="My Change Requests" defaultOpen={false}>
            <div className="sm:col-span-2 space-y-2">
              {myRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.field_name.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">"{r.current_value || '—'}" → "{r.requested_value}"</p>
                    {r.hr_notes && <p className="text-xs text-gray-400 mt-0.5">HR notes: {r.hr_notes}</p>}
                    {r.document_name && (
                      <button
                        onClick={() => handleViewDocument(r.id)}
                        className="text-xs text-blue-600 hover:underline mt-0.5"
                      >
                        View submitted document ({r.document_name})
                      </button>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    r.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {r.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

      </div>
    </Layout>
  );
};

export default Profile;
