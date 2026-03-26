import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Settings, FileText, Terminal, Briefcase } from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, active }: any) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10 no-print">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2 text-blue-600">
            <LayoutDashboard size={28} />
            <span className="text-xl font-bold tracking-tight text-gray-900">PropTracker</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem 
            to="/" 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={location.pathname === '/'} 
          />
          <NavItem 
            to="/reports" 
            icon={FileText} 
            label="Reports" 
            active={location.pathname === '/reports'} 
          />
          <NavItem 
            to="/expenses" 
            icon={Briefcase} 
            label="Expenses" 
            active={location.pathname === '/expenses'} 
          />
          <NavItem 
            to="/logs" 
            icon={Terminal} 
            label="System Logs" 
            active={location.pathname === '/logs'} 
          />
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Management
          </div>
          {/* We rely on dashboard to navigate to specific months, but could list recent here */}
          <NavItem 
            to="/settings" 
            icon={Settings} 
            label="Settings" 
            active={location.pathname === '/settings'} 
          />
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Account
          </div>
          <button
            onClick={async () => {
              const { supabase } = await import('../services/supabaseClient');
              await supabase?.auth.signOut();
              window.location.reload();
            }}
            className="flex w-full items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="font-medium">Sign Out</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            &copy; 2026 Rental Tracker
          </div>
        </div>
      </aside>

      {/* Mobile Header (Visible only on small screens) */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-20 p-4 flex items-center justify-between no-print">
         <span className="text-xl font-bold text-gray-900">PropTracker</span>
         <div className="flex space-x-4 text-gray-500">
            <Link to="/"><LayoutDashboard /></Link>
            <Link to="/reports"><FileText /></Link>
            <Link to="/expenses"><Briefcase /></Link>
            <Link to="/settings"><Settings /></Link>
         </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto min-h-screen">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};