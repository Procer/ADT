import React, { Component, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initGlobalErrorHandlers, logToBackend } from './logger';

// --- Error Boundary robusto ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    componentDidCatch(error: any, info: any) {
        logToBackend('ERROR', `React Crash: ${error.message}`, {
            stack: error.stack,
            componentStack: info.componentStack
        });
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
                    <h1 className="text-red-500 text-2xl font-bold mb-4">¡Ups! Algo salió mal.</h1>
                    <p className="text-slate-400 mb-8 max-w-md">La aplicación de chofer no pudo iniciarse correctamente. Intente refrescar la página.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 px-6 py-3 rounded-xl font-bold text-white shadow-lg active:scale-95"
                    >
                        REINTENTAR
                    </button>
                    {this.state.error && (
                        <pre className="mt-8 text-[10px] text-slate-700 bg-black/30 p-4 rounded text-left overflow-auto max-w-full">
                            {this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}

// Inicializar el monitor de errores para App-Logs
initGlobalErrorHandlers();

console.log('[PWA] Inicializando React Root...');

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
