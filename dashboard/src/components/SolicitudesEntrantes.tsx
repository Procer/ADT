import { Mail, CheckCircle, XCircle, Clock, MapPin, Search, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function SolicitudesEntrantes({ tenantId }: { tenantId: string | null }) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [activeTab, setActiveTab] = useState<'requests' | 'logs'>('requests');
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 768;

    const fetchRequests = async () => {
        if (!tenantId) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/management/trips/incoming-requests?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(Array.isArray(res.data) ? res.data : []);

            const logsRes = await axios.get(`${API_BASE_URL}/management/email-logs?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
        } catch (err) {
            console.error('Error fetching incoming requests', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [tenantId]);

    const handleApprove = async (id: string) => {
        if (!window.confirm('¿Confirmar ingreso de este viaje al sistema? Se moverá a estado PENDIENTE para su asignación.')) return;
        try {
            const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
            if (!token) {
                alert('Sesión expirada o inválida. Por favor reingrese.');
                return;
            }
            await axios.patch(`${API_BASE_URL}/trips/${id}`, { estado: 'PENDIENTE' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Viaje aprobado correctamente.');
            fetchRequests();
        } catch (err: any) {
            console.error('Error approving trip', err);
            const msg = err.response?.data?.message || err.message || 'Error desconocido';
            alert('Error al aprobar el viaje: ' + msg);
        }
    };

    const handleSync = async () => {
        if (!tenantId) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/management/ingest-emails?tenantId=${tenantId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRequests();
        } catch (err) {
            alert('Error al sincronizar emails.');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm('¿Rechazar esta solicitud? El registro se eliminará.')) return;
        try {
            const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/trips/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRequests();
        } catch (err) {
            alert('Error al eliminar la solicitud.');
        }
    };

    const filtered = requests.filter(r =>
        r.client?.nombreRazonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.numeroCP?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: isMobile ? '1rem' : '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <style>{`
                @media (max-width: 768px) {
                    .requests-header { flex-direction: column !important; align-items: stretch !important; gap: 1.5rem !important; }
                    .requests-search { width: 100% !important; padding: 0.8rem 1rem !important; }
                    .requests-search input { width: 100% !important; }
                    .request-card { flex-direction: column !important; gap: 1.5rem !important; padding: 1.5rem !important; }
                    .request-grid { grid-template-columns: 1fr !important; gap: 1.25rem !important; }
                    .request-actions { width: 100% !important; margin-left: 0 !important; }
                    .request-btn-approve { flex: 1 !important; justify-content: center !important; }
                    .request-title-group p { margin-left: 0 !important; font-size: 0.85rem !important; }
                    .request-title-group h1 { font-size: 1.5rem !important; }
                }
                .tab-btn {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: none;
                    color: white;
                    opacity: 0.5;
                    cursor: pointer;
                    font-weight: 800;
                    font-size: 0.85rem;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s;
                }
                .tab-btn.active {
                    opacity: 1;
                    color: var(--accent-blue);
                    border-bottom-color: var(--accent-blue);
                }
            `}</style>

            <div className="requests-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: isMobile ? '2rem' : '2.5rem' }}>
                <div className="request-title-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: isMobile ? '0.5rem' : '0.75rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                            <Mail size={isMobile ? 24 : 28} color="var(--accent-blue)" />
                        </div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Solicitudes via Email</h1>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={handleSync}
                        disabled={loading}
                        style={{ background: 'var(--accent-blue)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '12px', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
                    >
                        {loading ? 'SINCRONIZANDO...' : 'SINCRONIZAR AHORA'}
                    </button>
                    <div className="glass-panel requests-search" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1.25rem', borderRadius: '12px' }}>
                        <Search size={18} opacity={0.4} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.85rem', outline: 'none', width: isMobile ? '100%' : '220px' }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                <button className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                    SOLICITUDES PENDIENTES ({requests.length})
                </button>
                <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
                    LOGS DE INGESTA (ERRORES)
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.5, fontWeight: 700 }}>PROCESANDO...</div>
            ) : activeTab === 'requests' ? (
                filtered.length === 0 ? (
                    <div className="glass-panel" style={{ padding: isMobile ? '3rem 1rem' : '5rem', textAlign: 'center', borderStyle: 'dashed', background: 'rgba(59, 130, 246, 0.02)' }}>
                        <ShieldCheck size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>Sin pendientes</h3>
                        <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>Todas las solicitudes han sido procesadas correctamente.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {filtered.map(r => (
                            <div key={r.id} className="glass-panel request-card" style={{ padding: '2.25rem', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                <div style={{ flex: 1, width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            INGESTA IA
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.4, fontSize: '0.75rem', fontWeight: 700 }}>
                                            <Clock size={14} /> {new Date(r.tsCreacion).toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="request-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.65rem', opacity: 0.4, fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Dador de Carga</label>
                                            <div style={{ fontSize: '1.05rem', fontWeight: 900 }}>{r.client?.nombreRazonSocial || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.65rem', opacity: 0.4, fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Referencia / ID</label>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-blue)' }}>{r.numeroCP || 'S/N'}</div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.65rem', opacity: 0.4, fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Destino Detectado</label>
                                            <div style={{ fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <MapPin size={18} color="#f87171" style={{ flexShrink: 0 }} />
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.destinoNombre || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                        <span style={{ opacity: 0.4, fontWeight: 700, marginRight: '0.5rem' }}>CONTEXTO:</span>
                                        <span style={{ opacity: 0.8, fontStyle: 'italic' }}>{r.cierreMotivo || 'Sin notas adicionales.'}</span>
                                    </div>
                                </div>

                                <div className="request-actions" style={{ display: 'flex', gap: '0.75rem', marginLeft: isMobile ? 0 : '3rem' }}>
                                    <button
                                        onClick={() => handleApprove(r.id)}
                                        className="request-btn-approve"
                                        style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.2)', padding: isMobile ? '0.85rem 1.25rem' : '1rem 1.5rem', borderRadius: '14px', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', transition: 'all 0.2s' }}
                                    >
                                        <CheckCircle size={20} /> APROBAR
                                    </button>
                                    <button
                                        onClick={() => handleReject(r.id)}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {logs.filter(l => l.estadoIngesta !== 'EXITOSO').map(l => (
                        <div key={l.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #f87171' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#f87171', letterSpacing: '0.1em' }}>
                                    {l.estadoIngesta}
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>
                                    {new Date(l.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>{l.asunto}</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '1rem' }}>
                                <b>Remitente:</b> {l.remitente}
                            </div>
                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                                {l.errorDetalle}
                            </div>
                        </div>
                    ))}
                    {logs.filter(l => l.estadoIngesta !== 'EXITOSO').length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.4 }}>No hay logs de error recientes.</div>
                    )}
                </div>
            )}
        </div>
    );
}
