import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/auth';
import toast from 'react-hot-toast';
import { User, Lock, ChevronDown, ChevronUp, LogOut, Eye, EyeOff } from 'lucide-react';

const Account = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showPwForm, setShowPwForm] = useState(true);
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPw, setChangingPw] = useState(false);

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
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout>
      <div className="space-y-5 max-w-2xl mx-auto">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">My Account</h2>
          <p className="text-gray-500 text-sm">Your login details and security settings</p>
        </div>

        {/* Account info */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          <div className="bg-amber-50 rounded-full w-14 h-14 flex items-center justify-center shrink-0">
            <User size={28} className="text-amber-700" />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Email Address</p>
            <p className="text-sm font-medium text-gray-800">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-1 capitalize">{user?.role}</p>
          </div>
        </div>

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
                  <div className="relative">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={(pwForm as any)[field]}
                      onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder={label}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => !prev)}
                      title={showPasswords ? 'Hide passwords' : 'Show passwords'}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={handleChangePassword} disabled={changingPw}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                {changingPw ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full bg-red-50 hover:bg-red-100 text-red-700 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </Layout>
  );
};

export default Account;
