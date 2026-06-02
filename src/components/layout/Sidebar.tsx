import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, User, ArrowLeftRight,
  TrendingUp, FileText, Menu, X,
  BookOpen
} from 'lucide-react';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile', icon: User, label: 'My Profile' },
  { to: '/transfers', icon: ArrowLeftRight, label: 'Transfer' },
  { to: '/promotions', icon: TrendingUp, label: 'Promotion' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/exams', icon: BookOpen, label: 'Examinations' },
];

const Sidebar = () => {
  const [open, setOpen] = useState(false);

  const navLinks = (
    <nav className="flex flex-col gap-1 px-3 pt-4">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
              isActive ? 'border-l-4' : ''
            }`
          }
          style={({ isActive }) =>
            isActive
              ? { backgroundColor: '#fdf8e1', color: '#B8860B', borderLeftColor: '#B8860B' }
              : { color: '#3d2200' }
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed bottom-4 right-4 z-50 text-white p-3 rounded-full shadow-lg"
        style={{ backgroundColor: '#B8860B' }}
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile sidebar */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-64 h-full shadow-xl"
            style={{ backgroundColor: '#FAF7F0' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-white px-4 py-4" style={{ backgroundColor: '#1C0A00' }}>
              <p className="font-bold">Menu</p>
            </div>
            {navLinks}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden md:block w-64 shadow-md min-h-screen"
        style={{ backgroundColor: '#FAF7F0', borderRight: '1px solid #e6c84a' }}
      >
        {navLinks}
      </aside>
    </>
  );
};

export default Sidebar;
