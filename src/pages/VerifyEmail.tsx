import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../api/auth';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }
    verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed.');
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0D2818' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-md p-8 text-center" style={{ backgroundColor: '#FFFEFA' }}>
        <h1 className="text-xl font-bold mb-2" style={{ color: '#0D2818' }}>Email Verification</h1>
        <p className={`text-sm mb-6 ${status === 'error' ? 'text-red-600' : status === 'success' ? 'text-green-600' : 'text-gray-500'}`}>
          {message}
        </p>
        <Link to="/login" className="inline-block text-white font-semibold py-2.5 px-6 rounded-lg text-sm"
          style={{ backgroundColor: '#C49A1A' }}>
          Go to Login
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
