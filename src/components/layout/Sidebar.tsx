import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, User, ArrowLeftRight,
  TrendingUp, FileText, Shield, Menu, X
} from 'lucide-react';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile', icon: User, label: 'My Profile' },
  { to: '/transfers', icon: ArrowLeftRight, label: 'Transfer' },
  { to: '/promotions', icon: TrendingUp, label: 'Promotion' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/credentials', icon: Shield, label: 'Credentials' },
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
              isActive
                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`
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
        className="md:hidden fixed bottom-4 right-4 z-50 bg-blue-700 text-white p-3 rounded-full shadow-lg"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile sidebar */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-40"
          onClick={() => setOpen(false)}>
          <div className="w-64 bg-white h-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-900 text-white px-4 py-4">
              <p className="font-bold">Menu</p>
            </div>
            {navLinks}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 bg-white shadow-md min-h-screen">
        {navLinks}
      </aside>
    </>
  );
};

export default Sidebar;