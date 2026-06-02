import { type ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <div className="flex flex-1 relative">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 min-w-0" style={{ backgroundColor: '#FAF7F0' }}>
        {children}
      </main>
    </div>
  </div>
);

export default Layout;