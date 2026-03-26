import { API_BASE_URL } from '../config';
import { useState, useEffect, useMemo } from 'react';
import {
    History, RefreshCcw, Search, 
    User, FileText, BadgeDollarSign, 
    Settings, AlertCircle, Info, 
    Maximize2, X, Calendar
} from 'lucide-react';
import axios from 'axios';



export default function LogVisor() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/management/logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const searchStr = filter.toLowerCase();
            const matchesText = 
                (log.message?.toLowerCase().includes(searchStr)) ||
                (log.usuario?.toLowerCase().includes(searchStr)) ||
                (log.accion?.toLowerCase().includes(searchStr));
            
            const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;
            return matchesText && matchesLevel;
        });
    }, [logs, filter, selectedLevel]);

    const getActionIcon = (accion: string) => {
        if (accion?.includes('PAGO')) return <BadgeDollarSign size={18} className="text-green-500" />;
        if (accion?.includes('VIAJE')) return <FileText size={18} className="text-blue-500" />;
        if (accion?.includes('PRECIO') || accion?.includes('CONFIG')) return <Settings size={18} className="text-orange-500" />;
        return <Info size={18} className="text-slate-400" />;
    };

    return (
        <div style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <History size={28} color="var(--accent-blue)" />
                        Auditoría de Operaciones
                    </h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>
                        Registro histórico de todas las acciones realizadas por administradores en el sistema.
                    </p>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        {['ALL', 'INFO', 'ERROR'].map(l => (
                            <button
                                key={l}
                                onClick={() => setSelectedLevel(l)}
                                style={{
                                    padding: '0.4rem 1rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: selectedLevel === l ? 'var(--accent-blue)' : 'transparent',
                                    color: selectedLevel === l ? 'white' : 'rgba(255,255,255,0.5)'
                                }}
                            >
                                {l === 'ALL' ? 'Todos' : l}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={fetchLogs} 
                        className="btn-secondary" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <RefreshCcw size={16} className={loading ? 'spin' : ''} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    <input 
                        type="text" 
                        placeholder="Buscar por usuario, acción o descripción..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6 }}>
                            <th style={{ padding: '1.2rem 1rem' }}>Fecha y Hora</th>
                            <th style={{ padding: '1.2rem 1rem' }}>Tipo</th>
                            <th style={{ padding: '1.2rem 1rem' }}>Usuario</th>
                            <th style={{ padding: '1.2rem 1rem' }}>Descripción de la Acción</th>
                            <th style={{ padding: '1.2rem 1rem', textAlign: 'right' }}>Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && logs.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '5rem', textAlign: 'center' }}>Cargando registros...</td></tr>
                        ) : filteredLogs.length > 0 ? (
                            filteredLogs.map((log, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                                        <div style={{ fontWeight: 700 }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {getActionIcon(log.accion)}
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.7 }}>
                                                {log.accion?.split('_')[0] || 'INFO'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.7rem', fontWeight: 900 }}>
                                                {log.usuario?.charAt(0) || 'U'}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{log.usuario || 'Sistema'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            {log.level === 'ERROR' && <AlertCircle size={16} color="#ef4444" />}
                                            <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
                                                {log.message}
                                            </p>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button 
                                            onClick={() => setSelectedLog(log)}
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                                        >
                                            <Maximize2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} style={{ padding: '5rem', textAlign: 'center', opacity: 0.5 }}>No se encontraron registros que coincidan con la búsqueda.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Detalle */}
            {selectedLog && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '600px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Detalle de la Acción</h2>
                            <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="glass-panel" style={{ padding: '1rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Usuario</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                                    <User size={14} /> {selectedLog.usuario}
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '1rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Fecha y Hora</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                                    <Calendar size={14} /> {new Date(selectedLog.timestamp).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.8rem' }}>Información Técnica / Contexto</div>
                            <pre style={{ margin: 0, fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', overflowX: 'auto', color: 'var(--accent-blue)', fontFamily: 'monospace' }}>
                                {JSON.stringify(selectedLog.context || {}, null, 2)}
                            </pre>
                        </div>

                        <button 
                            onClick={() => setSelectedLog(null)} 
                            className="btn-primary" 
                            style={{ width: '100%', marginTop: '2rem', padding: '0.8rem' }}
                        >
                            Cerrar Detalle
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}
