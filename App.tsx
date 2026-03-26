import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { ErrorLogger } from './components/ErrorLogger';
import { Auth } from './pages/Auth';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase?.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

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
          <Route path="/documents" element={<Documents />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;