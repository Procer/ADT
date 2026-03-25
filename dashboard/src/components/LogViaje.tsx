import { Clock, MapPin, User, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import MapModal from './MapModal';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function LogViaje({ tripId, onClose }: { tripId: string; onClose: () => void }) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMap, setSelectedMap] = useState<{ lat: number, lng: number, title: string } | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('admin_token');
                const res = await axios.get(`${API_BASE_URL}/trips/${tripId}/history`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHistory(res.data.timeline);
            } catch (err) {
                console.error('Error fetching trip history', err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [tripId]);

    const getIcon = (tipo: string, _accion?: string, esManual?: boolean) => {
        if (tipo === 'TRIP_CREATED') return <Info size={16} color="var(--accent-blue)" />;
        if (tipo === 'HITO_ADMIN') return <User size={16} color="#fbbf24" />;
        if (esManual || tipo === 'HITO_CHOFER') return <CheckCircle size={16} color="#4ade80" />;
        if (tipo === 'AUDIT_SISTEMA') return <Clock size={16} color="rgba(255,255,255,0.4)" />;
        return <MapPin size={16} color="rgba(255,255,255,0.2)" />;
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '--:--';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
            <div className="glass-panel" style={{ width: '650px', maxHeight: '85vh', padding: '2.5rem', borderRadius: '32px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Línea de Tiempo Auditoría</h2>
                        <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Seguimiento detallado entre GPS y acciones del chofer.</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 600 }}>Cerrar</button>
                </div>

                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>Reconstruyendo línea de tiempo...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {history.map((event, index) => {
                            const esHitoManual = event.tipo === 'HITO_CHOFER';
                            const esHitoAdmin = event.tipo === 'HITO_ADMIN';
                            const esAutoGps = event.tipo === 'AUTO_GPS';
                            const esCreacion = event.tipo === 'TRIP_CREATED';

                            return (
                                <div key={index} style={{ display: 'flex', gap: '1.5rem', position: 'relative', paddingBottom: '2rem' }}>
                                    {/* Timeline Line */}
                                    {index < history.length - 1 && (
                                        <div style={{ position: 'absolute', left: '15px', top: '30px', bottom: 0, width: '2px', background: esHitoManual ? 'rgba(74, 222, 128, 0.2)' : esHitoAdmin ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)' }}></div>
                                    )}

                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '10px',
                                        background: esHitoManual ? 'rgba(74, 222, 128, 0.1)' : esHitoAdmin ? 'rgba(251, 191, 36, 0.1)' : esCreacion ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 1,
                                        border: esHitoManual ? '1px solid rgba(74, 222, 128, 0.2)' : esHitoAdmin ? '1px solid rgba(251, 191, 36, 0.2)' : esCreacion ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent'
                                    }}>
                                        {getIcon(event.tipo, event.accion, esHitoManual)}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                            <div style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 900,
                                                letterSpacing: '0.05em',
                                                color: esHitoManual ? '#4ade80' : esHitoAdmin ? '#fbbf24' : esAutoGps ? 'rgba(255,255,255,0.3)' : 'var(--accent-blue)',
                                                textTransform: 'uppercase'
                                            }}>
                                                {esHitoManual ? '✓ ACCIÓN MANUAL DEL CHOFER' :
                                                    esHitoAdmin ? '⚙️ ACCIÓN ADMINISTRATIVA' :
                                                        esAutoGps ? '📡 SEGUIMIENTO AUTOMÁTICO GPS' :
                                                            esCreacion ? '🆕 CREACIÓN DEL VIAJE' :
                                                                '⚙️ EVENTO DE SISTEMA'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.4 }}>
                                                {formatTime(event.fecha)}
                                            </div>
                                        </div>

                                        <div style={{
                                            fontSize: '0.9rem',
                                            fontWeight: esHitoManual || esCreacion || esHitoAdmin ? 700 : 500,
                                            color: esHitoManual || esCreacion || esHitoAdmin ? 'white' : 'rgba(255,255,255,0.8)',
                                            padding: event.accion?.includes('ALERTA') || event.descripcion?.includes('ALERTA') ? '0.75rem 1rem' : '0',
                                            background: event.accion?.includes('ALERTA') || event.descripcion?.includes('ALERTA') ? 'rgba(244, 63, 94, 0.05)' : 'transparent',
                                            borderLeft: event.accion?.includes('ALERTA') || event.descripcion?.includes('ALERTA') ? '3px solid #f43f5e' : 'none',
                                            borderRadius: event.accion?.includes('ALERTA') || event.descripcion?.includes('ALERTA') ? '0 12px 12px 0' : '0',
                                            marginTop: event.accion?.includes('ALERTA') || event.descripcion?.includes('ALERTA') ? '0.5rem' : '0'
                                        }}>
                                            {(event.accion?.includes('ALERTA') || event.descripcion?.includes('ALERTA')) && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f43f5e', marginBottom: '0.4rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    <AlertTriangle size={14} /> ALERTA DE SISTEMA
                                                </div>
                                            )}
                                            <span style={{ color: (event.accion?.includes('ALERTA') || event.descripcion?.includes('ALERTA')) ? '#fda4af' : 'inherit' }}>
                                                {esHitoManual ? (event.descripcion || 'Cambio de estado') :
                                                    esHitoAdmin ? (event.descripcion || 'Acción administrativa') :
                                                        esAutoGps ? 'Posición reportada correctamente' :
                                                            (event.descripcion || event.accion)}
                                            </span>
                                        </div>

                                        {event.alertaGps && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0.6rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
                                                <AlertTriangle size={14} color="#ef4444" />
                                                <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>
                                                    Diferencia de {(event.distanciaGps / 1000).toFixed(2)} KM entre GPS y Chofer
                                                </div>
                                            </div>
                                        )}

                                        {event.coords && (
                                            <button
                                                onClick={() => setSelectedMap({
                                                    lat: event.coords.coordinates[1],
                                                    lng: event.coords.coordinates[0],
                                                    title: `${esHitoManual ? 'Chofer' : 'GPS'}: ${formatTime(event.fecha)}`
                                                })}
                                                style={{ background: 'rgba(59, 130, 246, 0.05)', border: 'none', color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 700, padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                            >
                                                <MapPin size={12} /> Ver en Mapa
                                            </button>
                                        )}

                                        {event.distancia !== undefined && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem' }}>
                                                <div style={{ fontSize: '0.75rem', color: event.fueraDeRango ? '#ef4444' : '#60a5fa', fontWeight: 700, background: event.fueraDeRango ? 'rgba(239, 68, 68, 0.1)' : 'rgba(96, 165, 250, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                                                    📏 {(event.distancia / 1000).toFixed(2)} KM al destino
                                                </div>
                                                {event.fueraDeRango && (
                                                    <div style={{ fontSize: '0.65rem', background: '#ef4444', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 900 }}>
                                                        ⚠️ FUERA DE RANGO
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

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
