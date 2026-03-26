import { API_BASE_URL } from '../config';
import { Terminal, AlertCircle, RefreshCcw, User, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';



export default function AppLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/management/pwa-logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching PWA logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 30000); // Auto-refresh cada 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Terminal size={24} color="var(--accent-blue)" />
                        Monitoreo de Apps (Choferes)
                    </h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Errores técnicos y eventos en tiempo real de la PWA</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
                >
                    <RefreshCcw size={16} className={loading ? 'spin' : ''} />
                    Actualizar
                </button>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6 }}>
                            <th style={{ padding: '1rem' }}>Timestamp</th>
                            <th style={{ padding: '1rem' }}>Nivel</th>
                            <th style={{ padding: '1rem' }}>Chofer ID</th>
                            <th style={{ padding: '1rem' }}>Mensaje / Error</th>
                            <th style={{ padding: '1rem' }}>Contexto Técnico</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && logs.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center' }}>Cargando logs del sistema...</td></tr>
                        ) : logs.length > 0 ? (
                            logs.map((log, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                    <td style={{ padding: '1rem', whiteSpace: 'nowrap', opacity: 0.7 }}>
                                        {new Date(log.timestamp).toLocaleString('es-AR')}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            background: log.level === 'ERROR' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                            color: log.level === 'ERROR' ? '#ef4444' : '#3b82f6'
                                        }}>
                                            {log.level}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <User size={12} opacity={0.5} />
                                            {log.driverId || 'Sistema'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {log.level === 'ERROR' && <AlertCircle size={14} color="#ef4444" />}
                                            {log.message || <span style={{ opacity: 0.3 }}>Sin mensaje</span>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.6, maxWidth: '400px', overflow: 'hidden' }}>
                                            {log.context ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    {log.context.state && <span>Estado: <b>{log.context.state}</b></span>}
                                                    {log.context.error && <span style={{ color: '#fca5a5', fontWeight: 'bold' }}>Err: {log.context.error}</span>}

                                                    {/* Mostrar stack si existe (cortado) */}
                                                    {log.context.stack && (
                                                        <div style={{
                                                            fontSize: '0.6rem',
                                                            background: 'rgba(0,0,0,0.3)',
                                                            padding: '0.4rem',
                                                            borderRadius: '4px',
                                                            fontFamily: 'monospace',
                                                            whiteSpace: 'pre-wrap',
                                                            maxHeight: '60px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {log.context.stack.substring(0, 200)}...
                                                        </div>
                                                    )}

                                                    {/* Mostrar body/query si existen */}
                                                    {(log.context.body || log.context.query) && (
                                                        <span style={{ fontSize: '0.65rem', color: '#818cf8' }}>
                                                            Payload: {JSON.stringify({ ...log.context.body, ...log.context.query }).substring(0, 50)}...
                                                        </span>
                                                    )}

                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6rem', opacity: 0.5 }}>
                                                        <Smartphone size={10} /> {log.context.userAgent || 'Unknown'}
                                                    </span>
                                                </div>
                                            ) : '-'}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center' }}>No se encontraron errores registrados recientemente.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}
