import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

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
      await login(form.email, form.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#1C0A00' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8" style={{ backgroundColor: '#FFFEF9' }}>
        <div className="text-center mb-8">
          <div className="text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#B8860B' }}>
            <span className="text-xl font-bold">GES</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1C0A00' }}>Teacher Portal</h1>
          <p className="text-sm mt-1" style={{ color: '#9a6f09' }}>Ghana Education Service</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2D1A00' }}>
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 text-sm"
              style={{ border: '1px solid #C9A227', color: '#1C0A00', backgroundColor: '#FFFEF9' }}
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2D1A00' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 pr-20 focus:outline-none focus:ring-2 text-sm"
                style={{ border: '1px solid #C9A227', color: '#1C0A00', backgroundColor: '#FFFEF9' }}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-medium focus:outline-none"
                style={{ color: '#B8860B' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 text-sm"
            style={{ backgroundColor: '#B8860B' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
