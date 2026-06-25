import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import gesLogo from '../assets/ges-logo.png';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome, ${user.name || user.email}!`);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.email_verification_required) {
        toast('Enter the code sent to your email', { icon: '📧' });
        navigate('/verify-email-code', { state: { email: err.response.data.email } });
        return;
      }
      toast.error(err.message || err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0D2818' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8" style={{ backgroundColor: '#FFFEFA' }}>
        <div className="text-center mb-8">
          <div className="rounded-full w-20 h-20 overflow-hidden mx-auto mb-4 bg-white p-1.5 shadow-md">
            <img src={gesLogo} alt="GES" className="h-full w-auto block" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#0D2818' }}>Teacher Portal</h1>
          <p className="text-sm mt-1" style={{ color: '#9C7A0A' }}>Ghana Education Service</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#163D24' }}>
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 text-sm"
              style={{ border: '1px solid #D4AF37', color: '#0D2818', backgroundColor: '#FFFEFA' }}
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#163D24' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 pr-11 focus:outline-none focus:ring-2 text-sm"
                style={{ border: '1px solid #D4AF37', color: '#0D2818', backgroundColor: '#FFFEFA' }}
                placeholder="Enter your password"
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
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 text-sm"
            style={{ backgroundColor: '#C49A1A' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
