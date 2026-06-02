import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 text-white px-4 md:px-6 py-4 flex justify-between items-center shadow-lg">
      <div>
        <h1 className="font-bold text-base md:text-lg">GES Teacher Portal</h1>
        <p className="text-slate-300 text-xs">Ghana Education Service</p>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <User size={16} />
          <span>{user?.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg text-sm transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* Mobile menu button */}
      <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-slate-900 z-50 px-4 py-4 flex flex-col gap-3 md:hidden shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <User size={16} />
            <span>{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-amber-600 px-3 py-2 rounded-lg text-sm w-full"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;