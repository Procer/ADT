/**
 * Configuración dinámica de la URL del API
 * Resuelve problemas de despliegue donde la URL de oficina (192.168.x.x)
 * se hornea en el build de producción.
 */
export const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;

    // Detectar si estamos en un navegador
    if (typeof window !== 'undefined') {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // Si no es localhost, forzamos el uso del dominio actual /api para evitar errores de red o CORS
        if (!isLocalhost) {
            // Si la URL horneada es local o privada, asumimos que el backend está en el mismo server
            if (!envUrl || envUrl.includes('192.168.') || envUrl.includes('localhost')) {
                return `${window.location.protocol}//${window.location.host}/api`;
            }
        }
    }

    return envUrl || 'http://localhost:3001';
};

export const API_BASE_URL = getApiUrl();
