import React, { useEffect } from 'react';
import { DriverApp } from './components/DriverApp';
import { logToBackend } from './logger';

const App: React.FC = () => {
  useEffect(() => {
    console.log('[App] Mounting...');
    logToBackend('INFO', 'App Mount');
  }, []);

  return (
    <div className="bg-slate-950 min-h-screen text-white">
      <React.Suspense fallback={<div className="flex items-center justify-center h-screen font-bold">Cargando aplicación...</div>}>
        <DriverApp />
      </React.Suspense>
    </div>
  );
}

export default App;
