import { Terminal, RefreshCcw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function ServerPm2Logs() {
    const [logData, setLogData] = useState<any>(null);
    const [type, setType] = useState<'error' | 'out'>('error');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
            const res = await axios.get(`${API_BASE_URL}/management/server-pm2-logs?type=${type}&role=${user.role}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogData(res.data);
            // Hacer scroll al final después de cargar
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);
        } catch (err) {
            console.error('Error fetching logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 10000); // Auto-refresh cada 10s
        return () => clearInterval(interval);
    }, [type]);

    return (
        <div style={{ padding: '2rem', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Terminal size={24} color="#10b981" /> Consola de Servidor (PM2)
                    </h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Visualización en tiempo real de los logs del sistema</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <select
                        value={type}
                        onChange={(e: any) => setType(e.target.value)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            color: 'white',
                            padding: '0.6rem 1rem',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            outline: 'none'
                        }}
                    >
                        <option style={{ background: '#0f172a' }} value="error">Logs de Error</option>
                        <option style={{ background: '#0f172a' }} value="out">Logs de Salida (Out)</option>
                    </select>
                    <button
                        onClick={fetchLogs}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
                    >
                        <RefreshCcw size={16} className={loading ? 'spin' : ''} />
                        Recargar
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    background: '#000000',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    fontFamily: '"Fira Code", "Courier New", monospace',
                    fontSize: '0.8rem',
                    color: type === 'error' ? '#fca5a5' : '#d1d5db',
                    overflowY: 'auto',
                    border: '1px solid #333',
                    whiteSpace: 'pre-wrap',
                    boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.8)',
                    lineHeight: '1.4'
                }}
            >
                {loading && !logData ? (
                    <div style={{ color: '#aaa' }}>Conectando con el servidor PM2...</div>
                ) : (
                    logData?.content || 'El archivo de log está vacío.'
                )}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                    Ruta: <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{logData?.path}</code>
                </div>
                {logData?.timestamp && (
                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                        Última actualización: {new Date(logData.timestamp).toLocaleTimeString()}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
                
                /* Estilo para el scrollbar en la consola */
                div::-webkit-scrollbar { width: 8px; }
                div::-webkit-scrollbar-track { background: #000; }
                div::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
                div::-webkit-scrollbar-thumb:hover { background: #444; }
            `}</style>
        </div>
    );
}
