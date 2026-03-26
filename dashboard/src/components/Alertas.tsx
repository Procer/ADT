import { API_BASE_URL } from '../config';
import { Activity, CheckCircle, AlertTriangle, MessageSquare, ShieldAlert, Clock, Map as MapIcon, ChevronRight, User, Truck, Navigation } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import MapModal from './MapModal';



export default function Alertas({ tenantId }: { tenantId: string | null }) {
    const [alertas, setAlertas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMap, setSelectedMap] = useState<{ lat: number, lng: number, title: string } | null>(null);
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [comentario, setComentario] = useState('');
    const [filterResuelto, setFilterResuelto] = useState('false');
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 768;

    const fetchAlertas = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/management/alerts?tenantId=${tenantId || ''}&resuelto=${filterResuelto}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlertas(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching alerts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlertas();
    }, [tenantId, filterResuelto]);

    const handleResolve = async (id: string) => {
        if (!comentario) return alert('Debe ingresar un comentario de resolución');
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/alerts/${id}/resolve`, { comentario }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResolvingId(null);
            setComentario('');
            fetchAlertas();
        } catch (err) {
            console.error('Error resolving alert', err);
            setResolvingId(null);
            setComentario('');
            fetchAlertas();
        }
    };

    const getSeverity = (a: any) => {
        if (filterResuelto === 'true') return { label: 'RESUELTA', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' };
        if (a.isSpeedAlert) return { label: 'CRÍTICA', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
        if (a.fueraDeRango) return { label: 'IMPORTANTE', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
        return { label: 'INFO', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
    };

    return (
        <div style={{ padding: isMobile ? '1rem' : '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <style>{`
                @media (max-width: 768px) {
                    .alerts-header { flex-direction: column !important; align-items: stretch !important; gap: 1.5rem !important; }
                    .alerts-filter-tabs { width: 100% !important; flex-wrap: wrap !important; }
                    .alerts-filter-tab { flex: 1 !important; text-align: center !important; justify-content: center !important; font-size: 0.75rem !important; padding: 0.6rem 1rem !important; }
                    .alert-card-main { flex-direction: column !important; gap: 1.5rem !important; }
                    .alert-card-info { flex-direction: column !important; gap: 1rem !important; }
                    .alert-card-v-divider { display: none !important; }
                    .alert-card-side { width: 100% !important; margin-left: 0 !important; }
                    .alert-actions { flex-direction: column !important; gap: 0.75rem !important; }
                    .alert-action-btn { width: 100% !important; }
                    .alert-title-group h1 { font-size: 1.5rem !important; }
                    .alert-title-group p { margin-left: 0 !important; }
                }
            `}</style>

            {/* Header Rediseñado */}
            <div className="alerts-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: isMobile ? '2rem' : '3.5rem' }}>
                <div className="alert-title-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: isMobile ? '0.5rem' : '0.75rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <ShieldAlert size={isMobile ? 24 : 28} color="#f87171" />
                        </div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Centro de Monitoreo</h1>
                    </div>
                    <p style={{ opacity: 0.5, fontSize: '0.9rem', marginLeft: isMobile ? '0' : '3.75rem', fontWeight: 500 }}>Seguimiento en tiempo real de anomalías y telemetría.</p>
                </div>

                <div className="glass-panel alerts-filter-tabs" style={{ display: 'flex', padding: '0.3rem', gap: '0.3rem', borderRadius: '14px' }}>
                    <button
                        onClick={() => setFilterResuelto('false')}
                        className="alerts-filter-tab"
                        style={{
                            padding: '0.75rem 1.25rem',
                            borderRadius: '10px',
                            border: 'none',
                            background: filterResuelto === 'false' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                            color: filterResuelto === 'false' ? '#f87171' : 'rgba(255,255,255,0.4)',
                            fontWeight: 800,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Activity size={16} /> INCIDENCIAS
                    </button>
                    <button
                        onClick={() => setFilterResuelto('true')}
                        className="alerts-filter-tab"
                        style={{
                            padding: '0.75rem 1.25rem',
                            borderRadius: '10px',
                            border: 'none',
                            background: filterResuelto === 'true' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                            color: filterResuelto === 'true' ? '#4ade80' : 'rgba(255,255,255,0.4)',
                            fontWeight: 800,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <CheckCircle size={16} /> HISTORIAL
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem', opacity: 0.5 }}>
                    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#f87171', borderRadius: '50%', marginBottom: '1.5rem' }} />
                    <p style={{ fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.08em' }}>ANALIZANDO TELEMETRÍA...</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {alertas.length === 0 ? (
                        <div className="glass-panel" style={{ padding: isMobile ? '3rem 1rem' : '5rem', textAlign: 'center', borderStyle: 'dashed', background: 'rgba(34, 197, 94, 0.02)' }}>
                            <div style={{ width: '80px', height: '80px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                                <CheckCircle size={40} color="#4ade80" />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.75rem' }}>Sistema Operativo OK</h3>
                            <p style={{ opacity: 0.5, fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                                {filterResuelto === 'true' ? 'No hay incidencias cerradas recientemente.' : 'No se han detectado anomalías de telemetría en las rutas activas.'}
                            </p>
                        </div>
                    ) : (
                        alertas.map(a => {
                            const sev = getSeverity(a);
                            return (
                                <div key={a.id} className="glass-panel" style={{ padding: isMobile ? '1.5rem' : '2.25rem', border: '1px solid var(--glass-border)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s' }}>
                                    {/* Indicador Lateral de Severidad */}
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: sev.color }} />

                                    <div className="alert-card-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                                <div style={{ background: sev.bg, color: sev.color, padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', border: `1px solid ${sev.color}33` }}>
                                                    {sev.label}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>
                                                    <Clock size={14} />
                                                    {new Date(a.timestampDispositivo).toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="alert-card-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', marginBottom: '1.75rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <h3 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <Truck size={22} color="var(--accent-blue)" /> {a.cartaPorte?.unidad?.patente || 'S/P'}
                                                    </h3>
                                                    <p style={{ opacity: 0.6, fontSize: '0.85rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <User size={14} /> {a.cartaPorte?.chofer?.nombre || 'Chofer sin asignar'}
                                                    </p>
                                                </div>

                                                <div className="alert-card-v-divider" style={{ height: '40px', width: '1px', background: 'var(--glass-border)' }} />

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    <span style={{ fontSize: '0.65rem', opacity: 0.4, fontWeight: 800, textTransform: 'uppercase' }}>Viaje Referencia</span>
                                                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        {a.cartaPorte?.numeroCP || 'S/N'} <ChevronRight size={16} opacity={0.3} />
                                                    </span>
                                                </div>
                                            </div>

                                            {a.mensaje && (
                                                <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                    <AlertTriangle size={20} color={sev.color} style={{ marginTop: '0.15rem' }} />
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.6 }}>
                                                        <strong style={{ color: sev.color, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem', fontWeight: 900 }}>Alerta de Telemetría</strong>
                                                        {a.mensaje}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="alert-actions" style={{ display: 'flex', gap: '1rem' }}>
                                                <button
                                                    onClick={() => setSelectedMap({
                                                        lat: a.coords?.coordinates[1],
                                                        lng: a.coords?.coordinates[0],
                                                        title: `Posición GPS: ${a.cartaPorte?.unidad?.patente}`
                                                    })}
                                                    className="alert-action-btn"
                                                    style={{ background: 'var(--accent-blue)', padding: '0.75rem 1.25rem', borderRadius: '10px', fontSize: '0.8rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', border: 'none', fontWeight: 800, transition: 'all 0.2s' }}
                                                >
                                                    <MapIcon size={16} /> POSICIÓN GPS
                                                </button>

                                                {a.isSpeedAlert ? (
                                                    <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                        <Activity size={16} /> {Math.round(a.velocidad)} KM/H
                                                    </div>
                                                ) : (
                                                    <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(255, 255, 255, 0.05)', color: 'white', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                                        <Navigation size={16} /> {(a.distanciaDestinoMetros / 1000).toFixed(2)} KM DESTINO
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="alert-card-side" style={{ width: '320px', marginLeft: '3rem' }}>
                                            {!a.resuelto && (
                                                resolvingId === a.id ? (
                                                    <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.75rem', opacity: 0.5 }}>PROTOCOLO DE RESOLUCIÓN</div>
                                                        <textarea
                                                            placeholder="Describa la acción tomada..."
                                                            value={comentario}
                                                            onChange={e => setComentario(e.target.value)}
                                                            style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '10px', fontSize: '0.8rem', marginBottom: '1rem', minHeight: '100px', outline: 'none', resize: 'none' }}
                                                        />
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button onClick={() => handleResolve(a.id)} className="btn-primary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.75rem', fontWeight: 900 }}>GUARDAR</button>
                                                            <button onClick={() => setResolvingId(null)} className="btn-secondary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.75rem', fontWeight: 900 }}>SALIR</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setResolvingId(a.id)}
                                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.25)', color: '#4ade80', padding: '1rem', borderRadius: '14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 900, transition: 'all 0.2s' }}
                                                    >
                                                        <MessageSquare size={18} /> GESTIONAR CIERRE
                                                    </button>
                                                )
                                            )}

                                            {a.resuelto && (
                                                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '14px', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                                                    <div style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900, fontSize: '0.7rem', marginBottom: '1rem', letterSpacing: '0.1em' }}>
                                                        <CheckCircle size={14} /> INCIDENCIA CERRADA
                                                    </div>
                                                    {a.comentarioResolucion && (
                                                        <div style={{ fontSize: '0.8rem', opacity: 0.8, fontStyle: 'italic', color: 'white', lineHeight: 1.6 }}>
                                                            "{a.comentarioResolucion}"
                                                        </div>
                                                    )}
                                                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(34, 197, 94, 0.1)', fontSize: '0.65rem', opacity: 0.4, fontWeight: 800 }}>
                                                        ANALISTA: {a.resueltoPor || 'SISTEMA'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {selectedMap && (
                <MapModal
                    lat={selectedMap.lat}
                    lng={selectedMap.lng}
                    title={selectedMap.title}
                    onClose={() => setSelectedMap(null)}
                />
            )}
        </div>
    );
}
