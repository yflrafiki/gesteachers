import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import toast from 'react-hot-toast';
import gesLogo from '../assets/ges-logo.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }

    setSubmitting(true);
    try {
      await forgotPassword({ email });
      toast.success('If an account exists for that email, a reset code has been sent to it.');
      navigate('/reset-password', { state: { email } });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0D2818' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8" style={{ backgroundColor: '#FFFEFA' }}>
        <div className="text-center mb-8">
          <div className="rounded-full w-20 h-20 overflow-hidden mx-auto mb-4 bg-white p-1.5 shadow-md">
            <img src={gesLogo} alt="GES" className="h-full w-auto block" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#0D2818' }}>Forgot Password</h1>
          <p className="text-sm mt-1 text-gray-500">
            Enter your account email and we'll send you a reset code
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
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50"
            style={{ backgroundColor: '#C49A1A' }}
          >
            {submitting ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>

        <div className="flex items-center justify-center mt-4 text-sm">
          <Link to="/login" className="text-gray-500 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
