import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import gesLogo from '../../assets/ges-logo.png';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav
      className="text-white px-4 md:px-6 py-4 flex justify-between items-center shadow-lg relative"
      style={{ backgroundColor: '#0D2818' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white p-0.5">
          {/* Source logo is the full GES wordmark (crest + text); crop to just the crest for a compact badge */}
          <img src={gesLogo} alt="GES" className="h-full w-auto block" />
        </div>
        <div>
          <h1 className="font-bold text-base md:text-lg">GES Teacher Portal</h1>
          <p className="text-xs" style={{ color: '#E8C547' }}>Ghana Education Service</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <button
          onClick={() => navigate('/account')}
          title="My Account"
          className="flex items-center justify-center w-9 h-9 rounded-full transition"
          style={{ backgroundColor: '#C49A1A' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#9C7A0A')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C49A1A')}
        >
          <User size={18} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
