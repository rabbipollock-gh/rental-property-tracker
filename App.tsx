import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { MonthDetails } from './pages/MonthDetails';
import { Settings } from './pages/Settings';
import { Statement } from './pages/Statement';
import { PaymentReceipt } from './pages/PaymentReceipt';
import { Reports } from './pages/Reports';
import { Expenses } from './pages/Expenses';
import { ErrorLog } from './pages/ErrorLog';
import { ErrorLogger } from './components/ErrorLogger';

const App: React.FC = () => {
  return (
    <Router>
      <ErrorLogger />
      <Routes>
        <Route path="/statement/:id" element={<Statement />} />
        <Route path="/receipt/:monthId/:paymentId" element={<PaymentReceipt />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/month/:id" element={<MonthDetails />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/logs" element={<ErrorLog />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;