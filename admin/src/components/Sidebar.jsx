import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, PlusCircle, ChevronLeft, ChevronRight, LogOut, X, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EagleMark from './EagleMark';

const NAV = [
  { path: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
  { path: '/orders', label: 'Items', icon: Package },
  { path: '/statuses', label: 'Statuses', icon: Activity },
  
];

function isItemActive(item, pathname) {
  if (item.exact) return pathname === item.path;
  if (item.path === '/orders') {
    return pathname === '/orders' || /^\/orders\/[0-9a-f-]{36}$/i.test(pathname);
  }
  return pathname === item.path;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function closeMobile() {
    if (onMobileClose) onMobileClose();
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={closeMobile} />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-slate-950 border-r border-slate-800/80 z-50 flex flex-col
          transition-[width,transform] duration-200
          ${collapsed ? 'md:w-16' : 'md:w-60'}
          ${mobileOpen ? 'w-60 translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800/80">
          <Link to="/" onClick={closeMobile} className="flex items-center gap-2.5 text-white hover:text-slate-200 transition min-w-0">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white shrink-0">
              <EagleMark size={16} />
            </div>
            {!collapsed && <span className="font-semibold text-sm tracking-tight truncate">EagleCourier</span>}
          </Link>
          <button onClick={closeMobile} className="md:hidden text-slate-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <div className="px-2 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Workspace
            </div>
          )}
          {NAV.map((item) => {
            const active = isItemActive(item, location.pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors
                  ${active ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-slate-800/80 space-y-0.5">
          <button
            onClick={onToggle}
            className="hidden md:flex w-full items-center gap-2.5 px-2.5 py-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors text-sm"
          >
            {collapsed ? <ChevronRight size={18} className="shrink-0" /> : (<><ChevronLeft size={18} className="shrink-0" /><span>Collapse</span></>)}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors text-sm"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}