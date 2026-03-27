import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { MonthDetails } from './pages/MonthDetails';
import { Transactions } from './pages/Transactions';
import { Properties } from './pages/Properties';
import { Documents } from './pages/Documents';
import { Settings } from './pages/Settings';
import { Statement } from './pages/Statement';
import { PaymentReceipt } from './pages/PaymentReceipt';
import { Reports } from './pages/Reports';
import { Maintenance } from './pages/Maintenance';
import { ErrorLogger } from './components/ErrorLogger';
import { Auth } from './pages/Auth';
import { supabase } from './services/supabaseClient';

import { useUserRole } from './hooks/useUserRole';
import { TenantLayout } from './components/tenant/TenantLayout';
import { TenantDashboard, TenantMaintenance, TenantDocs, TenantPay } from './pages/tenant/TenantPages';

const TenantPreviewWrapper = () => {
  const { tenantId } = useParams();
  return <TenantLayout previewTenantId={tenantId} />;
};

const App: React.FC = () => {
  const role = useUserRole();

  if (role === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Authenticating Secure Session...</div>;
  }

  if (role === null) {
    return <Auth />;
  }

  // Phase 12: Tenant Portal PWA Routing
  if (role === 'tenant') {
    return (
      <Router>
        <ErrorLogger />
        <Routes>
          <Route element={<TenantLayout />}>
            <Route path="/tenant" element={<TenantDashboard />} />
            <Route path="/tenant/maintenance" element={<TenantMaintenance />} />
            <Route path="/tenant/documents" element={<TenantDocs />} />
            <Route path="/tenant/pay" element={<TenantPay />} />
          </Route>
          <Route path="*" element={<Navigate to="/tenant" replace />} />
        </Routes>
      </Router>
    );
  }

  // Default: Enterprise Landlord Dashboard
  return (
    <Router>
      <ErrorLogger />
      <Routes>
        <Route path="/statement/:id" element={<Statement />} />
        <Route path="/receipt/:monthId/:paymentId" element={<PaymentReceipt />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/month/:id" element={<MonthDetails />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        {/* Landlord Impersonation Route */}
        <Route path="/preview/:tenantId" element={<TenantPreviewWrapper />}>
            <Route index element={<TenantDashboard />} />
            <Route path="maintenance" element={<TenantMaintenance />} />
            <Route path="documents" element={<TenantDocs />} />
            <Route path="pay" element={<TenantPay />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;