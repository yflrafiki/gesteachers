import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import VerifyEmailCode from './pages/VerifyEmailCode';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Account from './pages/Account';
import Transfers from './pages/Transfers';
import Promotions from './pages/Promotions';
import Documents from './pages/Documents';
import Spinner from './components/common/Spinner';
import Exams from './pages/Exams';
import RequestChange from './pages/RequestChange';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'teacher') return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email-code" element={<VerifyEmailCode />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/transfers" element={<ProtectedRoute><Transfers /></ProtectedRoute>} />
        <Route path="/promotions" element={<ProtectedRoute><Promotions /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute><Exams /></ProtectedRoute>} />
        <Route path="/profile/request-change" element={<ProtectedRoute><RequestChange /></ProtectedRoute>} />
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;