import { create } from 'zustand';

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  type: 'error' | 'warning' | 'info';
}

interface ErrorLogState {
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useErrorLog = create<ErrorLogState>((set) => ({
  logs: JSON.parse(localStorage.getItem('error_logs') || '[]'),
  addLog: (log) => set((state) => {
    const newLog: LogEntry = {
      ...log,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
    };
    const newLogs = [newLog, ...state.logs].slice(0, 100); // Keep last 100 logs
    localStorage.setItem('error_logs', JSON.stringify(newLogs));
    return { logs: newLogs };
  }),
  clearLogs: () => set(() => {
    localStorage.removeItem('error_logs');
    return { logs: [] };
  }),
}));
