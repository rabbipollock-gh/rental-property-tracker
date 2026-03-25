import React, { useEffect } from 'react';
import { useErrorLog } from '../hooks/useErrorLog';

export const ErrorLogger: React.FC = () => {
  const addLog = useErrorLog((state) => state.addLog);

  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      originalError(...args);
      const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      addLog({ message, type: 'error' });
    };

    console.warn = (...args) => {
      originalWarn(...args);
      const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      addLog({ message, type: 'warning' });
    };

    window.addEventListener('error', (event) => {
      addLog({ message: event.message, stack: event.error?.stack, type: 'error' });
    });

    window.addEventListener('unhandledrejection', (event) => {
      addLog({ message: String(event.reason), type: 'error' });
    });

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [addLog]);

  return null;
};
