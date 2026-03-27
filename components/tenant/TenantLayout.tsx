import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Home, PenTool, FileText, CreditCard, LogOut, ArrowLeft } from 'lucide-react';
import { TenantProvider } from '../../hooks/tenant/useTenantData';

export const TenantLayout: React.FC<{ previewTenantId?: string }> = ({ previewTenantId }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (previewTenantId) {
      navigate('/');
      return;
    }
    await supabase.auth.signOut();
  };

  const navItems = [
    { name: 'Home', path: previewTenantId ? `/preview/${previewTenantId}` : '/tenant', icon: Home },
    { name: 'Repairs', path: previewTenantId ? `/preview/${previewTenantId}/maintenance` : '/tenant/maintenance', icon: PenTool },
    { name: 'Docs', path: previewTenantId ? `/preview/${previewTenantId}/documents` : '/tenant/documents', icon: FileText },
    { name: 'Pay', path: previewTenantId ? `/preview/${previewTenantId}/pay` : '/tenant/pay', icon: CreditCard }
  ];

  return (
    <TenantProvider previewTenantId={previewTenantId}>
      <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
        {/* Top Header */}
        <header className="bg-white border-b sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            {previewTenantId ? 'Preview: Tenant Portal' : 'Tenant Portal'}
          </h1>
          <button onClick={handleLogout} className="flex items-center space-x-2 text-sm font-medium px-3 py-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title={previewTenantId ? 'Back to Dashboard' : 'Sign Out'}>
            {previewTenantId ? (
                <><span>Exit Preview</span><LogOut size={16} /></>
            ) : (
                <LogOut size={20} />
            )}
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-lg mx-auto p-4 animate-in fade-in duration-300">
          <Outlet />
        </main>

        {/* Bottom PWA Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40">
          <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === `/preview/${previewTenantId}` && location.pathname === `/preview/${previewTenantId}/`);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </TenantProvider>
  );
};
