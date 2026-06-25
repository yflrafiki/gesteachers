import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { verifyEmailCode, resendVerificationCode } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import gesLogo from '../assets/ges-logo.png';

const VerifyEmailCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const emailFromState = (location.state as { email?: string } | undefined)?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) { toast.error('Enter your email and the code'); return; }

    setSubmitting(true);
    try {
      const res = await verifyEmailCode({ email, code });
      const { token, user } = res.data;
      setSession(token, user);
      toast.success(`Welcome, ${user.name || user.email}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) { toast.error('Enter your email first'); return; }
    setResending(true);
    try {
      await resendVerificationCode({ email });
      toast.success('A new code has been sent to your email');
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
          <h1 className="text-2xl font-bold" style={{ color: '#0D2818' }}>Verify Your Email</h1>
          <p className="text-sm mt-1 text-gray-500">
            Enter the 6-digit code sent to your email
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
              Verification Code
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
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50"
            style={{ backgroundColor: '#C49A1A' }}
          >
            {submitting ? 'Verifying...' : 'Verify Email'}
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

export default VerifyEmailCode;
