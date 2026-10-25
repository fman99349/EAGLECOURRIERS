import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const TITLES = {
  '/': 'Overview',
  '/orders': 'Items',
  '/orders/new': 'New Item',
  '/statuses': 'Status Manager',
};

export default function AdminLayout({ children }) {
  const { admin } = useAuth();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('eagle_sidebar_collapsed') === 'true'
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('eagle_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const title =
    TITLES[location.pathname] ||
    (location.pathname.startsWith('/orders/') ? 'Order Detail' : 'EagleCourier');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={`transition-[padding] duration-200 ${collapsed ? 'md:pl-16' : 'md:pl-60'}`}>
        <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur border-b border-slate-800/80">
          <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden text-slate-400 hover:text-white p-1"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-base font-semibold truncate max-w-[150px] sm:max-w-none">{title}</h1>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-200 leading-tight">
                  {admin?.full_name}
                </div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider">
                  {admin?.role?.replace('_', ' ')}
                </div>
              </div>
              <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-semibold text-slate-300">
                {admin?.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}