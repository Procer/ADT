import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const logToBackend = async (level: 'INFO' | 'ERROR', message: string, context: any = {}) => {
    try {
        const driverData = JSON.parse(localStorage.getItem('trip-store') || '{}');
        const driverId = driverData?.state?.user?.id || 'Unknown';
        
        await axios.post(`${API_BASE_URL}/management/pwa-logs`, {
            level,
            message,
            driverId,
            context: {
                ...context,
                userAgent: navigator.userAgent,
                url: window.location.href
            }
        });
    } catch (err) {
        // Fallback silente para evitar loops si el logger falla
        console.error('Failed to send log to backend', err);
    }
};

export const initGlobalErrorHandlers = () => {
    window.onerror = (message, source, lineno, colno, error) => {
        logToBackend('ERROR', `Uncaught Error: ${message}`, {
            source,
            lineno,
            colno,
            error: error?.stack || error?.message
        });
    };

    window.onunhandledrejection = (event) => {
        logToBackend('ERROR', `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`, {
            reason: event.reason?.stack || event.reason
        });
    };
    
    // Log inicial de sesión
    logToBackend('INFO', 'Aplicación PWA Iniciada');
};
