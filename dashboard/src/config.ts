// Dynamic API Configuration for Dashboard
const getApiBaseUrl = () => {
    // If we are in production (sistema.anka.ar), use the relative /api path
    if (window.location.hostname === 'sistema.anka.ar' || window.location.protocol === 'https:') {
        return '/api';
    }

    // Local/Dev environment: use the VITE_API_URL from .env or default to 3001
    return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();
