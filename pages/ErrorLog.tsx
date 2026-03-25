import React from 'react';
import { useErrorLog } from '../hooks/useErrorLog';
import { Trash2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const ErrorLog: React.FC = () => {
  const { logs, clearLogs } = useErrorLog();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
        <button
          onClick={clearLogs}
          className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition"
        >
          <Trash2 size={20} />
          <span>Clear Logs</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No logs recorded.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:px-6 hover:bg-gray-50 transition">
                <div className="flex items-start space-x-3">
                  <div className={`mt-1 ${
                    log.type === 'error' ? 'text-red-500' :
                    log.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                  }`}>
                    {log.type === 'error' ? <AlertCircle size={20} /> :
                     log.type === 'warning' ? <AlertTriangle size={20} /> :
                     <Info size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 uppercase">
                        {log.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 break-words whitespace-pre-wrap">
                      {log.message}
                    </p>
                    {log.stack && (
                      <pre className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded overflow-x-auto">
                        {log.stack}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
