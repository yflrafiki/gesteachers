import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/auth';
import toast from 'react-hot-toast';
import gesLogo from '../assets/ges-logo.png';
import { Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string } | undefined)?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code || !newPassword) { toast.error('Fill in all fields'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    setSubmitting(true);
    try {
      await resetPassword({ email, code, new_password: newPassword });
      toast.success('Password reset successfully — please log in');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) { toast.error('Enter your email first'); return; }
    setResending(true);
    try {
      await forgotPassword({ email });
      toast.success('A new reset code has been sent to your email');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0D2818' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8" style={{ backgroundColor: '#FFFEFA' }}>
        <div className="text-center mb-8">
          <div className="rounded-full w-20 h-20 overflow-hidden mx-auto mb-4 bg-white p-1.5 shadow-md">
            <img src={gesLogo} alt="GES" className="h-full w-auto block" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#0D2818' }}>Reset Password</h1>
          <p className="text-sm mt-1 text-gray-500">
            Enter the code sent to your email and choose a new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#163D24' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 text-sm"
              style={{ border: '1px solid #D4AF37', color: '#0D2818', backgroundColor: '#FFFEFA' }}
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#163D24' }}>
              Reset Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 text-center text-2xl font-bold tracking-[0.3em]"
              style={{ border: '1px solid #D4AF37', color: '#0D2818', backgroundColor: '#FFFEFA' }}
              placeholder="000000"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#163D24' }}>
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 pr-11 focus:outline-none focus:ring-2 text-sm"
                style={{ border: '1px solid #D4AF37', color: '#0D2818', backgroundColor: '#FFFEFA' }}
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 focus:outline-none"
                style={{ color: '#C49A1A' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#163D24' }}>
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 text-sm"
              style={{ border: '1px solid #D4AF37', color: '#0D2818', backgroundColor: '#FFFEFA' }}
              placeholder="Re-enter new password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50"
            style={{ backgroundColor: '#C49A1A' }}
          >
            {submitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="flex items-center justify-between mt-4 text-sm">
          <button
            onClick={handleResend}
            disabled={resending}
            className="font-medium hover:underline disabled:opacity-50"
            style={{ color: '#C49A1A' }}
          >
            {resending ? 'Sending...' : "Didn't get a code? Resend"}
          </button>
          <Link to="/login" className="text-gray-500 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
