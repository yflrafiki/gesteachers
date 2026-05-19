import { useState, useEffect, useRef } from 'react';
import { getMyProfile, updateMyProfile } from '../api/teachers';
import Layout from '../components/layout/Layout';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';
import { User, Edit, Save, X, Camera, ChevronDown, ChevronUp } from 'lucide-react';

const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Rev', 'Alhaji', 'Madam'];
const QUALIFICATIONS = ['Certificate', 'Diploma', 'B.Ed', 'B.A', 'B.Sc', 'M.Ed', 'M.A', 'M.Sc', 'PhD'];
const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed', 'separated'];

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

const Field = ({
  label, value, editing, field, form, setForm,
  type = 'text', options, readOnly = false, fullWidth = false
}: {
  label: string;
  value: any;
  editing: boolean;
  field: string;
  form: any;
  setForm: any;
  type?: string;
  options?: string[];
  readOnly?: boolean;
  fullWidth?: boolean;
}) => {
  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const displayValue = () => {
    if (value === null || value === undefined || value === '') return '—';
    if (type === 'checkbox') return value ? 'Yes' : 'No';
    if (typeof value === 'string' && value.includes('T')) return value.split('T')[0];
    return String(value);
  };

  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {editing && !readOnly ? (
        type === 'select' && options ? (
          <select
            value={form[field] ?? ''}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className={inputClass}
          >
            <option value="">Select {label}...</option>
            {options.map(o => (
              <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
            ))}
          </select>
        ) : type === 'checkbox' ? (
          <div className="flex items-center gap-3 mt-1">
            <input
              type="checkbox"
              checked={form[field] ?? false}
              onChange={(e) => setForm({ ...form, [field]: e.target.checked })}
              className="w-5 h-5 accent-blue-600 cursor-pointer"
            />
            <span className="text-sm text-gray-600">Yes</span>
          </div>
        ) : (
          <input
            type={type}
            value={form[field] ?? ''}
            onChange={(e) => setForm({
              ...form,
              [field]: type === 'number'
                ? parseInt(e.target.value) || 0
                : e.target.value
            })}
            className={inputClass}
          />
        )
      ) : (
        <p className={`text-sm font-medium ${
          readOnly ? 'text-gray-400 italic' : 'text-gray-800'
        }`}>
          {displayValue()}
          {readOnly && editing && (
            <span className="text-xs text-gray-400 ml-2">(Managed by HR)</span>
          )}
        </p>
      )}
    </div>
  );
};

const Profile = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<any>({});

  const loadProfile = async () => {
    try {
      const res = await getMyProfile();
      const data = res.data;
      setProfile(data);
      initForm(data);
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const initForm = (data: any) => {
    setForm({
      // Personal — all editable by teacher
      title: data.title || '',
      phone: data.phone || '',
      gender: data.gender || '',
      marital_status: data.marital_status || '',
      nationality: data.nationality || '',
      hometown: data.hometown || '',
      date_of_birth: data.date_of_birth
        ? data.date_of_birth.split('T')[0] : '',
      // Professional — editable by teacher
      subject_specialization: data.subject_specialization || '',
      qualification: data.qualification || '',
      national_date_of_present_rank: data.national_date_of_present_rank
        ? data.national_date_of_present_rank.split('T')[0] : '',
      years_in_current_rank: data.years_in_current_rank || 0,
      // Diversity — editable by teacher
      disability_status: data.disability_status || false,
      disability_type: data.disability_type || '',
    });
  };

  useEffect(() => { loadProfile(); }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be under 2MB');
      return;
    }
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
      if (photoFile) {
        formData.append('passport_photo', photoFile);
      }
      const res = await updateMyProfile(formData);
      setProfile(res.data.teacher);
      initForm(res.data.teacher);
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
    if (profile) initForm(profile);
  };

  if (loading) return <Layout><Spinner /></Layout>;

  const normalizePhotoSrc = (photoPath: string) => {
    const trimmed = photoPath.trim();
    if (/^https?:\/\/localhost:5000/i.test(trimmed)) {
      return trimmed.replace(/^https?:\/\/localhost:5000/i, '');
    }
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  };

  const photoSrc = photoPreview ||
    (profile?.passport_photo
      ? normalizePhotoSrc(profile.passport_photo)
      : null);

  const employmentStatus = profile?.employment_status || 'active';

  return (
    <Layout>
      <div className="space-y-5 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">My Profile</h2>
            <p className="text-gray-500 text-sm">
              View and update your personal information
            </p>
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
                onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
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
                    <img
                      src={photoSrc}
                      alt="Passport photo"
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="bg-blue-100 rounded-full w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                      <User size={36} className="text-blue-700" />
                    </div>
                  )}
                </div>
                {editing && (
                  <>
                    <button
                      onClick={() => photoRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-blue-700 text-white rounded-full p-1.5 shadow-lg hover:bg-blue-800 transition"
                      title="Upload passport photo"
                    >
                      <Camera size={14} />
                    </button>
                    <input
                      ref={photoRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              {/* Name & Status */}
              <div className="pb-2 flex-1">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">
                  {profile?.title} {profile?.first_name} {profile?.last_name}
                </h3>
                <p className="text-gray-500 text-sm">
                  {profile?.staff_id} · {profile?.email}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    employmentStatus === 'active' ? 'bg-green-100 text-green-700' :
                    employmentStatus === 'on_leave' ? 'bg-yellow-100 text-yellow-700' :
                    employmentStatus === 'suspended' ? 'bg-red-100 text-red-700' :
                    employmentStatus === 'retired' ? 'bg-gray-100 text-gray-600' :
                    'bg-red-100 text-red-700'
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
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 mb-2">
                You can edit all personal details. Employment details like school,
                district, grade and appointment dates are managed by HR.
              </div>
            )}
          </div>
        </div>

        {/* Personal Information — ALL editable by teacher */}
        <Section title="Personal Information">
          <Field label="Title" value={profile?.title} editing={editing}
            field="title" form={form} setForm={setForm}
            type="select" options={TITLES} />
          <Field label="Date of Birth" value={profile?.date_of_birth}
            editing={editing} field="date_of_birth"
            form={form} setForm={setForm} type="date" />
          <Field label="Phone Number" value={profile?.phone} editing={editing}
            field="phone" form={form} setForm={setForm} type="tel" />
          <Field label="Gender" value={profile?.gender} editing={editing}
            field="gender" form={form} setForm={setForm}
            type="select" options={['Male', 'Female']} />
          <Field label="Marital Status" value={profile?.marital_status}
            editing={editing} field="marital_status"
            form={form} setForm={setForm}
            type="select" options={MARITAL_STATUSES} />
          <Field label="Nationality" value={profile?.nationality}
            editing={editing} field="nationality"
            form={form} setForm={setForm} />
          <Field label="Hometown" value={profile?.hometown}
            editing={editing} field="hometown"
            form={form} setForm={setForm} />
        </Section>

        {/* Professional Information — teacher edits some */}
        <Section title="Professional Information">
          <Field label="Subject Specialization" value={profile?.subject_specialization}
            editing={editing} field="subject_specialization"
            form={form} setForm={setForm} />
          <Field label="Qualification" value={profile?.qualification}
            editing={editing} field="qualification"
            form={form} setForm={setForm}
            type="select" options={QUALIFICATIONS} />
          <Field label="Current Grade / Rank" value={profile?.current_grade}
            editing={editing} field="current_grade"
            form={form} setForm={setForm} readOnly />
          <Field label="Years of Service" value={profile?.years_of_service}
            editing={editing} field="years_of_service"
            form={form} setForm={setForm} readOnly />
          <Field label="National Date of Present Rank"
            value={profile?.national_date_of_present_rank}
            editing={editing} field="national_date_of_present_rank"
            form={form} setForm={setForm} type="date" />
          <Field label="Years in Current Rank"
            value={profile?.years_in_current_rank}
            editing={editing} field="years_in_current_rank"
            form={form} setForm={setForm} type="number" />
        </Section>

        {/* Employment Details — HR managed, teacher views only */}
        <Section title="Employment Details" defaultOpen={false}>
          <Field label="Current School" value={profile?.current_school}
            editing={editing} field="current_school"
            form={form} setForm={setForm} readOnly />
          <Field label="Current District" value={profile?.current_district}
            editing={editing} field="current_district"
            form={form} setForm={setForm} readOnly />
          <Field label="Current Region" value={profile?.current_region}
            editing={editing} field="current_region"
            form={form} setForm={setForm} readOnly />
          <Field label="Date of First Appointment"
            value={profile?.date_of_first_appointment}
            editing={editing} field="date_of_first_appointment"
            form={form} setForm={setForm} readOnly />
          <Field label="Date of Confirmation"
            value={profile?.date_of_confirmation}
            editing={editing} field="date_of_confirmation"
            form={form} setForm={setForm} readOnly />
          <Field label="Date of Current Posting"
            value={profile?.date_of_current_posting}
            editing={editing} field="date_of_current_posting"
            form={form} setForm={setForm} readOnly />
          <Field label="Employment Status"
            value={profile?.employment_status}
            editing={editing} field="employment_status"
            form={form} setForm={setForm} readOnly />
        </Section>

        {/* Diversity & Health — teacher edits */}
        <Section title="Diversity & Health" defaultOpen={false}>
          <Field label="Do you have a disability?"
            value={profile?.disability_status}
            editing={editing} field="disability_status"
            form={form} setForm={setForm}
            type="checkbox" fullWidth />
          {(form.disability_status || profile?.disability_status) && (
            <Field label="Disability Type / Description"
              value={profile?.disability_type}
              editing={editing} field="disability_type"
              form={form} setForm={setForm} fullWidth />
          )}
        </Section>

      </div>
    </Layout>
  );
};

export default Profile;